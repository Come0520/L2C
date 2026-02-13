'use server';

import { db } from '@/shared/api/db';
import { channelCommissions, channelSettlements, channels } from '@/shared/api/schema/channels';
import { paymentBills } from '@/shared/api/schema/finance';
import { eq, and, desc, between, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

// ==================== 结算单 Actions ====================

/**
 * 生成结算单编号
 * 格式：STL + YYYYMMDD + 6位随机数
 */
function generateSettlementNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `STL${year}${month}${day}${random}`;
}

/**
 * 创建结算单（汇总指定周期的佣金）
 * 
 * 安全检查：需要 CHANNEL.MANAGE_SETTLEMENT 权限
 */
export async function createSettlement(params: {
    channelId: string;
    periodStart: Date;
    periodEnd: Date;
    adjustmentAmount?: number;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查
    await checkPermission(session, PERMISSIONS.CHANNEL.MANAGE_SETTLEMENT);

    const tenantId = session.user.tenantId;
    const { channelId, periodStart, periodEnd, adjustmentAmount = 0 } = params;

    // 验证渠道属于当前租户
    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, channelId), eq(channels.tenantId, tenantId))
    });
    if (!channel) throw new Error('渠道不存在或无权操作');

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

        // 计算佣金总额
        const totalCommission = pendingCommissions.reduce(
            (sum, c) => sum + parseFloat(c.amount || '0'),
            0
        );
        const finalAmount = totalCommission + adjustmentAmount;

        // 创建结算单
        const [settlement] = await tx.insert(channelSettlements).values({
            tenantId,
            settlementNo: generateSettlementNo(),
            channelId,
            periodStart,
            periodEnd,
            totalCommission: totalCommission.toFixed(2),
            adjustmentAmount: adjustmentAmount.toFixed(2),
            finalAmount: finalAmount.toFixed(2),
            status: 'DRAFT',
            createdBy: session.user.id,
        }).returning();

        // 更新佣金记录状态为已结算
        const commissionIds = pendingCommissions.map(c => c.id);
        await tx.update(channelCommissions)
            .set({
                status: 'SETTLED',
                settlementId: settlement.id,
                settledAt: new Date(),
                updatedAt: new Date(),
            })
            .where(inArray(channelCommissions.id, commissionIds));

        revalidatePath('/channels');
        revalidatePath('/finance/settlements');
        return settlement;
    });
}

/**
 * 获取结算单列表
 * 
 * 安全检查：自动从 session 获取 tenantId
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

    const countResult = await db.query.channelSettlements.findMany({
        where: whereClause,
        columns: { id: true },
    });

    return {
        data,
        totalItems: countResult.length,
        totalPages: Math.ceil(countResult.length / pageSize),
        currentPage: page,
    };
}

/**
 * 获取结算单详情
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getSettlementById(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const tenantId = session.user.tenantId;

    const settlement = await db.query.channelSettlements.findFirst({
        where: and(
            eq(channelSettlements.id, id),
            eq(channelSettlements.tenantId, tenantId)
        ),
        with: {
            channel: true,
        }
    });

    if (!settlement) return null;

    // 获取关联的佣金记录
    const commissions = await db.query.channelCommissions.findMany({
        where: eq(channelCommissions.settlementId, id),
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
 * 安全检查：需要 CHANNEL.MANAGE_SETTLEMENT 权限
 */
export async function submitSettlementForApproval(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

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
 * 安全检查：需要 FINANCE.APPROVE 权限
 * 审批通过后自动生成付款单
 */
export async function approveSettlement(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

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

    return await db.transaction(async (tx) => {
        // 更新结算单状态为已审批
        const [updated] = await tx.update(channelSettlements)
            .set({
                status: 'APPROVED',
                approvedBy: session.user.id,
                approvedAt: new Date(),
            })
            .where(eq(channelSettlements.id, id))
            .returning();

        // 自动创建付款单
        const paymentNo = `BILL-CH-${Date.now()}`;

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
            recordedBy: session.user.id!,
            remark: `渠道结算付款 - ${settlement.settlementNo}`,
        }).returning();

        // 更新结算单关联付款单
        await tx.update(channelSettlements)
            .set({ paymentBillId: paymentBill.id })
            .where(eq(channelSettlements.id, id));

        revalidatePath('/channels');
        revalidatePath('/finance/settlements');
        revalidatePath('/finance/ap');

        return { settlement: updated, paymentBill };
    });
}

/**
 * 标记结算单已付款
 * 
 * 安全检查：需要 FINANCE.APPROVE 权限
 */
export async function markSettlementPaid(id: string, paymentBillId?: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

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
            .where(eq(channelCommissions.settlementId, id));

        revalidatePath('/channels');
        revalidatePath('/finance/settlements');
        return settlement;
    });
}
