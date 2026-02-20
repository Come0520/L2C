'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/shared/api/db';
import { eq, and, sql, sum } from 'drizzle-orm';
import { afterSalesTickets, liabilityNotices } from '@/shared/api/schema';
import { generateNoticeNo } from '../utils';
import { AuditService } from '@/shared/lib/audit-service';
import {
    createLiabilitySchema,
    confirmLiabilitySchema,
    disputeLiabilitySchema,
    arbitrateLiabilitySchema
} from './schemas';

/**
 * 创建定责通知单 (Server Action)
 * 校验工单状态（已关闭工单禁止定责），并生成唯一定责单号。
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

        revalidatePath(`/after-sales/${data.afterSalesId}`);
        return { success: true, data: newNotice, message: "定责单创建成功" };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "服务器内部错误";
        console.error('[After Sales] Create Liability Notice Failed:', err);
        return { success: false, message };
    }
});

/**
 * 创建一份定责通知单
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

        const totalDeduction = Number(aggr?.total || 0);

        await tx.update(afterSalesTickets)
            .set({
                actualDeduction: totalDeduction.toFixed(2),
                updatedAt: new Date(),
            })
            .where(eq(afterSalesTickets.id, notice.afterSalesId));

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
            console.error('[财务联动失败] 供应商扣款:', err);

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

    return { success: true, message: "定责单已确认，工单扣款金额已同步更新" };
});

/**
 * 确认定责通知单及其扣款金额
 */
export async function confirmLiabilityNotice(data: z.infer<typeof confirmLiabilitySchema>) {
    return confirmLiabilityNoticeAction(data);
}

/**
 * 提交定责单 (Server Action)
 * 将状态从 DRAFT 变更为 PENDING_CONFIRM，通知相关方。
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

        return { success: true, message: '定责单已提交，等待责任人确认' };
    } catch (err: unknown) {
        console.error('[After Sales] Submit Liability Notice Failed:', err);
        return { success: false, message: err instanceof Error ? err.message : "服务器内部错误" };
    }
});

/**
 * 提交定责通知单供责任方确认
 */
export async function submitLiabilityNotice(data: z.infer<typeof confirmLiabilitySchema>) {
    return submitLiabilityNoticeAction(data);
}

/**
 * 提起定责争议 (Server Action)
 * 责任方对定责结果有异议时使用，进入 DISPUTED 状态待仲裁。
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

        return { success: true, message: '已提交争议原因，等待仲裁' };
    } catch (err: unknown) {
        console.error('[After Sales] Dispute Liability Notice Failed:', err);
        return { success: false, message: err instanceof Error ? err.message : "服务器内部错误" };
    }
});

/**
 * 针对定责结果提起申诉争议
 */
export async function disputeLiabilityNotice(data: z.infer<typeof disputeLiabilitySchema>) {
    return disputeLiabilityNoticeAction(data);
}

/**
 * 定责仲裁处理 (Server Action)
 * 由高级管理员/售后总监介入，对争议单据进行最终裁定。
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

        return { success: true, message: '仲裁完成' };
    } catch (err: unknown) {
        console.error('[After Sales] Arbitrate Liability Notice Failed:', err);
        return { success: false, message: err instanceof Error ? err.message : "服务器内部错误" };
    }
});

/**
 * 管理员执行定责仲裁裁决
 */
export async function arbitrateLiabilityNotice(data: z.infer<typeof arbitrateLiabilitySchema>) {
    return arbitrateLiabilityNoticeAction(data);
}
