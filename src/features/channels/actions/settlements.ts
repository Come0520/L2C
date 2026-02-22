'use server';

import { db } from '@/shared/api/db';
import { channelCommissions, channelSettlements, channels } from '@/shared/api/schema/channels';
import { paymentBills } from '@/shared/api/schema/finance';
import { eq, and, desc, between, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { customAlphabet } from 'nanoid';
import { Decimal } from 'decimal.js';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';


// P2 Fix: Fix lint error (unused import is now used, check if we need to remove or keep)
// AuditService IS used in the added chunks. 


const generateRandomSuffix = customAlphabet('0123456789', 6);

// ==================== 结算单 Actions ====================

/**
 * 生成结算单编号
 * 
 * 使用自定义的 `0123456789` 字母表随机生成 6 位尾号，
 * 并以 `STL` + `YYYYMMDD` 格式拼接为订单号。
 * 
 * @returns {string} 结算单的唯一编号
 */
function generateSettlementNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `STL${year}${month}${day}${generateRandomSuffix()}`;
}

/**
 * 创建结算单（汇总指定周期的佣金）
 * 
 * 开启事务，根据给定的周期内所有待结算佣金生成结算单，自动计算修正金额、总计，并记录系统审计日志。
 * 数据处理时对于数据库生成的单号冲突 (code 23505) 提供重试机制。
 * 
 * 安全检查：需要 CHANNEL.MANAGE_SETTLEMENT 权限
 * 
 * @param {Object} params - 创建参数
 * @param {string} params.channelId - 渠道ID
 * @param {Date} params.periodStart - 统计周期开始时间
 * @param {Date} params.periodEnd - 统计周期结束时间
 * @param {number} [params.adjustmentAmount] - 手动调节的金额偏移量，默认0
 * @returns {Promise<any>} 返回新生成的结算单
 * @throws {Error} 若周期内无佣金或其它校验与事务异常时则抛出错误
 */
export async function createSettlement(params: {
    channelId: string;
    periodStart: Date;
    periodEnd: Date;
    adjustmentAmount?: number;
}) {
    console.log('[channels] 开始创建结算单:', params);
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查
    await checkPermission(session, PERMISSIONS.CHANNEL.MANAGE_SETTLEMENT);

    const tenantId = session.user.tenantId;
    const { channelId, periodStart, periodEnd, adjustmentAmount = 0 } = params;

    // P2 Fix: UUID Validation
    if (channelId) z.string().uuid().parse(channelId);

    // 验证渠道属于当前租户
    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, channelId), eq(channels.tenantId, tenantId))
    });
    if (!channel) throw new Error('渠道不存在或无权操作');

    // P2 Fix: Retry mechanism for unique constraint violation (Settlement No Collision)
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (true) {
        try {
            return await db.transaction(async (tx) => {
                // 获取该周期内待结算的佣金记录
                const pendingCommissions = await tx.query.channelCommissions.findMany({
                    where: and(
                        eq(channelCommissions.tenantId, tenantId),
                        eq(channelCommissions.channelId, channelId),
                        eq(channelCommissions.status, 'PENDING'),
                        between(channelCommissions.createdAt, periodStart, periodEnd)
                    ),
                });

                if (pendingCommissions.length === 0) {
                    throw new Error('该周期内没有待结算的佣金记录');
                }

                // P0 Fix: Calculate total commission using Decimal.js
                const totalCommission = pendingCommissions.reduce(
                    (sum, c) => sum.plus(new Decimal(c.amount || '0')),
                    new Decimal(0)
                );

                const adjustmentDecimal = new Decimal(adjustmentAmount);
                const finalAmount = totalCommission.plus(adjustmentDecimal);

                // 创建结算单
                const [settlement] = await tx.insert(channelSettlements).values({
                    tenantId,
                    settlementNo: generateSettlementNo(),
                    channelId,
                    periodStart,
                    periodEnd,
                    totalCommission: totalCommission.toFixed(2),
                    adjustmentAmount: adjustmentDecimal.toFixed(2),
                    finalAmount: finalAmount.toFixed(2),
                    status: 'DRAFT',
                    createdBy: session.user.id,
                }).returning();

                // 更新佣金记录状态为已结算
                const commissionIds = pendingCommissions.map(c => c.id);
                const updatedCommissions = await tx.update(channelCommissions)
                    .set({
                        status: 'SETTLED',
                        settlementId: settlement.id,
                        settledAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(and(
                        inArray(channelCommissions.id, commissionIds),
                        eq(channelCommissions.status, 'PENDING') // Critical: Ensure they are still pending
                    ))
                    .returning();

                if (updatedCommissions.length !== commissionIds.length) {
                    throw new Error('部分佣金记录已被处理，请刷新后重试');
                }

                // P1 Fix: Audit Log
                await AuditService.log(tx, {
                    tableName: 'channel_settlements',
                    recordId: settlement.id,
                    action: 'CREATE',
                    userId: session.user.id,
                    tenantId,
                    newValues: settlement,
                    details: { reason: 'Settlement creation', commissionCount: commissionIds.length }
                });

                revalidatePath('/channels');
                revalidatePath('/finance/settlements');
                return settlement;
            });
        } catch (error) {
            console.error('[channels] 创建结算单发生异常:', error);
            // Check for unique constraint violation code (Postgres: 23505)
            if (error instanceof Error && (error as { code?: string }).code === '23505' && retryCount < MAX_RETRIES) {
                console.warn(`[channels] 结算单号冲突，重试中... (${retryCount + 1}/${MAX_RETRIES})`);
                retryCount++;
                continue;
            }
            throw error;
        }
    }
}

/**
 * 获取结算单列表
 * 
 * 支持按状态、渠道等条件分页查询当前租户所有关联的结算单列表。
 * 
 * 安全检查：自动从 session 获取 tenantId
 * 
 * @param {Object} params - 分页与过滤参数
 * @param {string} [params.channelId] - 渠道ID
 * @param {'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID'} [params.status] - 结算单状态 (草稿/待处理/已批准/已支付)
 * @param {number} [params.page] - 查询页数
 * @param {number} [params.pageSize] - 页条目数
 * @returns {Promise<any>} 包含分页结算数据的结构
 */
export async function getSettlements(params: {
    channelId?: string;
    status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID';
    page?: number;
    pageSize?: number;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const tenantId = session.user.tenantId;
    const { channelId, status, page = 1, pageSize = 20 } = params;

    let whereClause = eq(channelSettlements.tenantId, tenantId);

    if (channelId) {
        // P2 Fix: UUID Validation
        z.string().uuid().parse(channelId);
        whereClause = and(whereClause, eq(channelSettlements.channelId, channelId)) as typeof whereClause;
    }

    if (status) {
        whereClause = and(whereClause, eq(channelSettlements.status, status)) as typeof whereClause;
    }

    const offset = (page - 1) * pageSize;

    const data = await db.query.channelSettlements.findMany({
        where: whereClause,
        limit: pageSize,
        offset,
        orderBy: [desc(channelSettlements.createdAt)],
        with: {
            channel: true,
        }
    });

    // Get count
    const totalItems = await db.$count(channelSettlements, whereClause);

    return {
        data,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page,
    };
}

/**
 * 获取结算单详情
 * 
 * 返回包含指定结算单本身详情以及它所包含的所有佣金明细、创建者与渠道信息的数据视图。
 * 
 * 安全检查：自动从 session 获取 tenantId
 * 
 * @param {string} id - 待获取结算单的 ID
 * @returns {Promise<any | null>} 结算单详情加上佣金明细和关联表，查无记录返回 null
 */
export async function getSettlementById(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    const tenantId = session.user.tenantId;

    const settlement = await db.query.channelSettlements.findFirst({
        where: and(
            eq(channelSettlements.id, id),
            eq(channelSettlements.tenantId, tenantId)
        ),
        with: {
            channel: true,
            createdBy: true, // P1 Fix: need to know who created it
        }
    });

    if (!settlement) return null;

    // 获取关联的佣金记录
    const commissions = await db.query.channelCommissions.findMany({
        where: and(
            eq(channelCommissions.settlementId, id),
            eq(channelCommissions.tenantId, tenantId)
        ),
        orderBy: [desc(channelCommissions.createdAt)],
    });

    return {
        ...settlement,
        commissions,
    };
}

/**
 * 提交结算单审批
 * 
 * 将草稿状态 (DRAFT) 的结算单推进为待审批 (PENDING) 状态，等待后续复核。
 * 
 * 安全检查：需要 CHANNEL.MANAGE_SETTLEMENT 权限
 * 
 * @param {string} id - 将要提交审核的结算单ID
 * @returns {Promise<any>} 返回更新后的记录集
 */
export async function submitSettlementForApproval(id: string) {
    console.log('[channels] 提交结算单审批:', { id });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    await checkPermission(session, PERMISSIONS.CHANNEL.MANAGE_SETTLEMENT);

    const tenantId = session.user.tenantId;

    const [updated] = await db.update(channelSettlements)
        .set({
            status: 'PENDING',
        })
        .where(and(
            eq(channelSettlements.id, id),
            eq(channelSettlements.tenantId, tenantId),
            eq(channelSettlements.status, 'DRAFT')
        ))
        .returning();

    revalidatePath('/channels');
    revalidatePath('/finance/settlements');
    return updated;
}

/**
 * 审批结算单
 * 
 * 校验隔离职责约束后，将待审批 (PENDING) 的结算单设为 APPROVED。
 * 同时会在财务账期模块中，自动生成基于渠道视域的应付对账/付款单 (paymentBills)。
 * 
 * 安全检查：需要 FINANCE.APPROVE 权限
 * 
 * @param {string} id - 即将批准的结算单ID
 * @returns {Promise<any>} 结算单连同新生成的支付单事务提交对象
 * @throws {Error} 未授权，无效状态或是自审批违反隔离原则引发的异常
 */
export async function approveSettlement(id: string) {
    console.log('[channels] 开始审批结算单:', { id });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    // 审批需要财务审批权限
    await checkPermission(session, PERMISSIONS.FINANCE.APPROVE);

    const tenantId = session.user.tenantId;

    // 获取结算单详情
    const settlement = await db.query.channelSettlements.findFirst({
        where: and(
            eq(channelSettlements.id, id),
            eq(channelSettlements.tenantId, tenantId),
            eq(channelSettlements.status, 'PENDING')
        ),
        with: { channel: true }
    });

    if (!settlement) {
        throw new Error('结算单不存在或状态不正确');
    }

    // P1 Fix: Prevent Self-Approval (Segregation of Duties)
    if (settlement.createdBy === session.user.id) {
        throw new Error('违反职责分离原则：禁止审批自己创建的结算单');
    }

    return await db.transaction(async (tx) => {
        // 更新结算单状态为已审批
        const [updated] = await tx.update(channelSettlements)
            .set({
                status: 'APPROVED',
                approvedBy: session.user.id,
                approvedAt: new Date(),
            })
            .where(and(
                eq(channelSettlements.id, id),
                eq(channelSettlements.tenantId, tenantId)
            ))
            .returning();

        // 自动创建付款单
        const paymentNo = `BILL-${generateSettlementNo().replace('STL', '')}`;

        const [paymentBill] = await tx.insert(paymentBills).values({
            tenantId,
            paymentNo,
            type: 'SUPPLIER', // 渠道付款视为供应商类型
            payeeType: 'SUPPLIER', // 渠道视为供应商
            payeeId: settlement.channelId, // 使用 channelId 作为 payeeId
            payeeName: settlement.channel.contactName || settlement.channel.name,
            amount: settlement.finalAmount,
            status: 'PENDING',
            paymentMethod: 'BANK', // 默认银行转账
            proofUrl: '', // 待付款后补充
            recordedBy: session.user.id,
            remark: `渠道结算付款 - ${settlement.settlementNo}`,
        }).returning();

        // 更新结算单关联付款单
        await tx.update(channelSettlements)
            .set({ paymentBillId: paymentBill.id })
            .where(and(
                eq(channelSettlements.id, id),
                eq(channelSettlements.tenantId, tenantId)
            ));

        // P1 Fix: Audit Log
        await AuditService.log(tx, {
            tableName: 'channel_settlements',
            recordId: id,
            action: 'APPROVE',
            userId: session.user.id,
            tenantId,
            newValues: { status: 'APPROVED', paymentBillId: paymentBill.id },
            details: { reason: 'Settlement approval', paymentBillNo: paymentNo }
        });

        revalidatePath('/channels');
        revalidatePath('/finance/settlements');
        revalidatePath('/finance/ap');

        return { settlement: updated, paymentBill };
    });
}

/**
 * 标记结算单已付款
 * 
 * 将已审批通过的结算单及其下所有相关佣金记录的业务状态一起标记为 PAID (已支付)。
 * 
 * 安全检查：需要 FINANCE.APPROVE 权限
 * 
 * @param {string} id - 已批准结算单的编号
 * @param {string} [paymentBillId] - 最终关联的打款流水记录号（可选）
 * @returns {Promise<any>} 返回状态更新后的结算单结果
 */
export async function markSettlementPaid(id: string, paymentBillId?: string) {
    console.log('[channels] 标记结算单为已付款:', { id, paymentBillId });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);
    if (paymentBillId) z.string().uuid().parse(paymentBillId);

    await checkPermission(session, PERMISSIONS.FINANCE.APPROVE);

    const tenantId = session.user.tenantId;

    return await db.transaction(async (tx) => {
        // 更新结算单状态
        const [settlement] = await tx.update(channelSettlements)
            .set({
                status: 'PAID',
                paymentBillId,
                paidAt: new Date(),
            })
            .where(and(
                eq(channelSettlements.id, id),
                eq(channelSettlements.tenantId, tenantId),
                eq(channelSettlements.status, 'APPROVED')
            ))
            .returning();

        // 更新关联佣金记录状态
        await tx.update(channelCommissions)
            .set({
                status: 'PAID',
                updatedAt: new Date(),
            })
            .where(and(
                eq(channelCommissions.settlementId, id),
                eq(channelCommissions.tenantId, tenantId)
            ));

        // P1 Fix: Audit Log
        await AuditService.log(tx, {
            tableName: 'channel_settlements',
            recordId: settlement.id,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId,
            newValues: { status: 'PAID', paymentBillId },
            details: { reason: 'Settlement paid' }
        });

        revalidatePath('/channels');
        revalidatePath('/finance/settlements');
        return settlement;
    });
}
