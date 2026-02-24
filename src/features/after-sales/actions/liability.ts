'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/shared/api/db';
import { eq, and, sql, sum } from 'drizzle-orm';
import { afterSalesTickets, liabilityNotices } from '@/shared/api/schema';
import { generateNoticeNo } from '../utils';
import { AuditService } from '@/shared/lib/audit-service';
import { Decimal } from 'decimal.js';
import {
    createLiabilitySchema,
    confirmLiabilitySchema,
    disputeLiabilitySchema,
    arbitrateLiabilitySchema
} from './schemas';
import { logger } from '@/shared/lib/logger';

/**
 * 创建定责通知单 (Server Action)
 * 校验工单状态（已关闭工单禁止定责），并生成唯一定责单号。
 * 定责单用于明确售后问题处理过程中的责任归属及赔偿金额。
 * 
 * @param data - 定责通知单创建参数对象，包含责任方类型、金额、原因等
 * @param ctx - 执行上下文对象，包含用户的 session 认证与租户信息
 * @returns 包含成功状态与新建立定责单数据的对象；失败则返回错误消息
 */
const createLiabilityNoticeAction = createSafeAction(createLiabilitySchema, async (data, { session }) => {
    const tenantId = session.user.tenantId;

    try {
        const newNotice = await db.transaction(async (tx) => {
            // 安全校验：确保工单属于当前租户
            const ticket = await tx.query.afterSalesTickets.findFirst({
                where: and(
                    eq(afterSalesTickets.id, data.afterSalesId),
                    eq(afterSalesTickets.tenantId, tenantId)
                ),
                columns: { id: true, tenantId: true, ticketNo: true, status: true }
            });

            if (!ticket) throw new Error('工单不存在或无权操作');
            if (ticket.status === 'CLOSED') throw new Error('已关闭工单无法发起定责');

            // P1 FIX (R2-05): 透传事务 tx 确保并发安全
            const noticeNo = await generateNoticeNo(tenantId, tx);

            const [inserted] = await tx.insert(liabilityNotices).values({
                tenantId: ticket.tenantId,
                noticeNo: noticeNo,
                afterSalesId: ticket.id,
                liablePartyType: data.liablePartyType,
                liablePartyId: data.liablePartyId,
                reason: data.reason,
                liabilityReasonCategory: data.liabilityReasonCategory,
                amount: data.amount.toString(),
                evidencePhotos: data.evidencePhotos,
                sourcePurchaseOrderId: data.sourcePurchaseOrderId,
                sourceInstallTaskId: data.sourceInstallTaskId,
                status: 'DRAFT',
            }).returning();

            return inserted;
        });

        // 记录审计日志
        await AuditService.recordFromSession(session, 'liability_notices', newNotice.id, 'CREATE', {
            new: newNotice as Record<string, unknown>,
        });

        logger.info(`[After Sales] Successfully created liability notice: ${newNotice.id} for ticket: ${data.afterSalesId}`);

        revalidatePath(`/after-sales/${data.afterSalesId}`);
        return { success: true, data: newNotice, message: "定责单创建成功" };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "服务器内部错误";
        logger.error('[After Sales] Create Liability Notice Failed:', { error: err });
        return { success: false, message };
    }
});

/**
 * 向系统提交新建一份草稿状态的定责通知单
 * 该方法封装了核心的安全 Action，对外暴露为普通的异步调用。
 * 
 * @param data - 由前端表单收集并经过 schema 校验后的定责数据参数
 * @returns 返回经过权限和数据完整性校验后的创建结果
 */
export async function createLiabilityNotice(data: z.infer<typeof createLiabilitySchema>) {
    return createLiabilityNoticeAction(data);
}

/**
 * 确认并同步定责单至财务模块 (Server Action)
 * 核心逻辑：
 * 1. 事务内更新定责单状态为 CONFIRMED。
 * 2. 累加工单下的所有已确认定责单，同步更新工单的 actualDeduction 字段。
 * 3. 异步尝试生成财务对账单 (仅限 FACTORY 责任方)。
 * 这个动作标志着对赔付和责任划分的最终认定，影响后续的资金流向。
 * 
 * @param data - 包含目标定责单 ID 的确认参数
 * @param ctx - 执行上下文对象，包含操作用户与其租户信息
 */
const confirmLiabilityNoticeAction = createSafeAction(confirmLiabilitySchema, async (data, { session }) => {
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    const result = await db.transaction(async (tx) => {
        // 安全校验：确保定责单属于当前租户
        const notice = await tx.query.liabilityNotices.findFirst({
            where: and(
                eq(liabilityNotices.id, data.noticeId),
                eq(liabilityNotices.tenantId, tenantId)
            ),
        });

        if (!notice) return { success: false, message: '定责单不存在或无权操作' };
        if (notice.status !== 'DRAFT') return { success: false, message: '只有草稿状态的定责单可以确认' };

        await tx.update(liabilityNotices).set({
            status: 'CONFIRMED',
            confirmedAt: new Date(),
            confirmedBy: userId,
            updatedAt: new Date(),
        }).where(eq(liabilityNotices.id, data.noticeId));

        // P0 FIX (R2-03): 使用数据库级 SUM 聚合计算总扣款，防止并发丢失更新
        const [aggr] = await tx
            .select({ total: sum(sql`CAST(${liabilityNotices.amount} AS DECIMAL)`) })
            .from(liabilityNotices)
            .where(and(
                eq(liabilityNotices.afterSalesId, notice.afterSalesId),
                eq(liabilityNotices.tenantId, tenantId),
                eq(liabilityNotices.status, 'CONFIRMED')
            ));

        const totalDeduction = new Decimal(aggr?.total || 0);

        await tx.update(afterSalesTickets)
            .set({
                actualDeduction: totalDeduction.toString(), // AS-D-01 防止舍入问题
                updatedAt: new Date(),
            })
            .where(and(
                eq(afterSalesTickets.id, notice.afterSalesId),
                eq(afterSalesTickets.tenantId, tenantId) // AS-S-04 防跨越并发写
            ));

        // P1 FIX (AS-R-01): 定责确认时自动计入欠款账本
        if (Number(notice.amount) > 0) {
            const { recordDebtLedger } = await import('../logic/deduction-safety');
            await recordDebtLedger({
                tenantId: tenantId,
                liablePartyType: notice.liablePartyType as any, // 确保类型收窄
                liablePartyId: notice.liablePartyId || "",
                originalAfterSalesId: notice.afterSalesId,
                originalLiabilityNoticeId: notice.id,
                amount: Number(notice.amount),
            }, tx);
        }

        return {
            success: true,
            notice,
            afterSalesId: notice.afterSalesId
        };
    });

    if (!result.success) return result;

    revalidatePath(`/after-sales/${result.afterSalesId}`);
    revalidateTag('after-sales-analytics', 'default');

    // P0 FIX (R2-04): 财务联动移至事务外部，确保幂等性和副作用一致性
    if (result.notice && result.notice.liablePartyType === 'FACTORY' && result.notice.liablePartyId) {
        try {
            const { createSupplierLiabilityStatement } = await import('@/features/finance/actions/ap');
            await createSupplierLiabilityStatement(data.noticeId);

            // 更新财务同步状态
            await db.update(liabilityNotices)
                .set({ financeStatus: 'SYNCED', financeSyncedAt: new Date() })
                .where(eq(liabilityNotices.id, data.noticeId));
        } catch (err) {
            logger.error('[财务联动失败] 供应商扣款:', { error: err, noticeId: data.noticeId });

            // 更新财务状态为失败
            await db.update(liabilityNotices)
                .set({ financeStatus: 'FAILED' })
                .where(eq(liabilityNotices.id, data.noticeId));

            return {
                success: true,
                message: "定责单已确认，但财务联动同步失败，请在财务模块手动核实",
                warning: err instanceof Error ? err.message : "对账单同步异常"
            };
        }
    }

    // 记录审计日志
    await AuditService.recordFromSession(session, 'liability_notices', data.noticeId, 'UPDATE', {
        old: { status: 'DRAFT' },
        new: { status: 'CONFIRMED', confirmedAt: new Date() },
        changed: { status: 'CONFIRMED' }
    });

    logger.info(`[After Sales] Liability notice ${data.noticeId} confirmed by user ${userId}`);

    return { success: true, message: "定责单已确认，工单扣款金额已同步更新" };
});

/**
 * 确认定责通知单并生效其扣款金额设定
 * 由具备审核权限的角色触发，确认后自动与财务系统及订单金额进行联动结算。
 * 
 * @param data - 指定即将被确认为生效的定责单及附带信息
 * @returns 确认流程的最终执行或错误反馈
 */
export async function confirmLiabilityNotice(data: z.infer<typeof confirmLiabilitySchema>) {
    return confirmLiabilityNoticeAction(data);
}

/**
 * 提交定责单 (Server Action)
 * 将单据工作流状态从 DRAFT（草稿）变更为 PENDING_CONFIRM（待确认），并通知相关责任人。
 * 这是定责确权流程的重要节点，触发后责任方将收到确认待办。
 * 
 * @param data - 带被提交定责单 ID 的参数要求
 * @param ctx - 执行上下文信息，含有当前操作的登录凭证
 */
const submitLiabilityNoticeAction = createSafeAction(confirmLiabilitySchema, async (data, { session }) => {
    const tenantId = session.user.tenantId;

    try {
        const notice = await db.query.liabilityNotices.findFirst({
            where: and(
                eq(liabilityNotices.id, data.noticeId),
                eq(liabilityNotices.tenantId, tenantId)
            ),
        });

        if (!notice) return { success: false, message: '定责单不存在' };
        if (notice.status !== 'DRAFT') return { success: false, message: '非法状态操作' };

        await db.update(liabilityNotices).set({
            status: 'PENDING_CONFIRM',
            updatedAt: new Date(),
        }).where(eq(liabilityNotices.id, data.noticeId));

        await AuditService.recordFromSession(session, 'liability_notices', data.noticeId, 'UPDATE', {
            old: { status: 'DRAFT' },
            new: { status: 'PENDING_CONFIRM' },
            changed: { status: 'PENDING_CONFIRM' }
        });

        logger.info(`[After Sales] Liability notice ${data.noticeId} submitted for confirmation`);

        return { success: true, message: '定责单已提交，等待责任人确认' };
    } catch (err: unknown) {
        logger.error('[After Sales] Submit Liability Notice Failed:', { error: err, noticeId: data.noticeId });
        return { success: false, message: err instanceof Error ? err.message : "服务器内部错误" };
    }
});

/**
 * 提交定责通知单以供目标责任方审核与确认
 * 定责金额将在确认环节通过后挂账或产生实际扣款动作。
 * 
 * @param data - 需要更新流转状态的定责表单提交参数
 * @returns 提示后续等待流转的成功与否状态
 */
export async function submitLiabilityNotice(data: z.infer<typeof confirmLiabilitySchema>) {
    return submitLiabilityNoticeAction(data);
}

/**
 * 提起定责争议申诉 (Server Action)
 * 责任方对分配到的定责或赔付金额存有异议时操作，工流状态进入 DISPUTED。
 * 系统将冻结这笔定责的执行逻辑直达高级仲裁判定介入。
 * 
 * @param data - 包含申诉反驳理由与原始定责单 ID 结构
 * @param ctx - 含租户安全层上下文对象
 */
const disputeLiabilityNoticeAction = createSafeAction(disputeLiabilitySchema, async (data, { session }) => {
    const tenantId = session.user.tenantId;

    try {
        const notice = await db.query.liabilityNotices.findFirst({
            where: and(
                eq(liabilityNotices.id, data.noticeId),
                eq(liabilityNotices.tenantId, tenantId)
            ),
        });

        if (!notice) return { success: false, message: '定责单不存在' };
        if (notice.status !== 'PENDING_CONFIRM') return { success: false, message: '只有待确认的定责单可以提起争议' };

        await db.update(liabilityNotices).set({
            status: 'DISPUTED',
            disputeReason: data.disputeReason,
            updatedAt: new Date(),
        }).where(eq(liabilityNotices.id, data.noticeId));

        await AuditService.recordFromSession(session, 'liability_notices', data.noticeId, 'UPDATE', {
            old: { status: 'PENDING_CONFIRM' },
            new: { status: 'DISPUTED', disputeReason: data.disputeReason },
            changed: { status: 'DISPUTED' }
        });

        logger.info(`[After Sales] Liability notice ${data.noticeId} disputed with reason: ${data.disputeReason}`);

        return { success: true, message: '已提交争议原因，等待仲裁' };
    } catch (err: unknown) {
        logger.error('[After Sales] Dispute Liability Notice Failed:', { error: err, noticeId: data.noticeId });
        return { success: false, message: err instanceof Error ? err.message : "服务器内部错误" };
    }
});

/**
 * 针对争议定责结果向平台方提起申诉流程
 * 必须填写充分合理的争议原因说明，用于后续的仲裁查证阶段。
 * 
 * @param data - 具有详细原因等校验的数据结构
 * @returns 表明争议申请状态已被成功处理的回传
 */
export async function disputeLiabilityNotice(data: z.infer<typeof disputeLiabilitySchema>) {
    return disputeLiabilityNoticeAction(data);
}

/**
 * 定责争议仲裁判定处理 (Server Action)
 * 该行为由高级管理员或售后总监直接介入干预。
 * 将依据调查结论对争议进行强力且最终的裁定（ARBITRATED），结束当前定责单的争议纠纷。
 * 
 * @param data - 包含带有明确判定结论与指定定责单依据的对象
 * @param ctx - 超级管理权限操作的下发执行上下文
 */
const arbitrateLiabilityNoticeAction = createSafeAction(arbitrateLiabilitySchema, async (data, { session }) => {
    const tenantId = session.user.tenantId;

    try {
        const notice = await db.query.liabilityNotices.findFirst({
            where: and(
                eq(liabilityNotices.id, data.noticeId),
                eq(liabilityNotices.tenantId, tenantId)
            ),
        });

        if (!notice) return { success: false, message: '定责单不存在' };
        if (notice.status !== 'DISPUTED') return { success: false, message: '只有争议中的定责单可以仲裁' };

        await db.update(liabilityNotices).set({
            status: 'ARBITRATED',
            arbitrationResult: data.arbitrationResult,
            arbitratedBy: session.user.id,
            arbitratedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(liabilityNotices.id, data.noticeId));

        await AuditService.recordFromSession(session, 'liability_notices', data.noticeId, 'UPDATE', {
            old: { status: 'DISPUTED' },
            new: { status: 'ARBITRATED', arbitrationResult: data.arbitrationResult },
            changed: { status: 'ARBITRATED' }
        });

        logger.info(`[After Sales] Liability notice ${data.noticeId} arbitrated by user ${session.user.id}`);

        return { success: true, message: '仲裁完成' };
    } catch (err: unknown) {
        logger.error('[After Sales] Arbitrate Liability Notice Failed:', { error: err, noticeId: data.noticeId });
        return { success: false, message: err instanceof Error ? err.message : "服务器内部错误" };
    }
});

/**
 * 管理员对有争议状态的通知单执行仲裁最终裁决
 * 对产生的损失判定和最终的分摊出具无法更改的平台判定结果。
 * 
 * @param data - 携带裁决说明详情的数据体
 * @returns 成功归结或异常详情
 */
export async function arbitrateLiabilityNotice(data: z.infer<typeof arbitrateLiabilitySchema>) {
    return arbitrateLiabilityNoticeAction(data);
}
