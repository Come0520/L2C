'use server';

import { db } from '@/shared/api/db';
import { channelCommissions, channels } from '@/shared/api/schema/channels';
import { orders } from '@/shared/api/schema/orders';
import { eq, sql, desc, and, inArray, between, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { Decimal } from 'decimal.js';
import { AuditService } from '@/shared/services/audit-service';
import { z } from 'zod';

// ==================== 佣金记录 Actions ====================

/**
 * 生成佣金记录（订单完成时调用）
 * 
 * 获取指定订单信息，并使用服务端的规则通过 Decimal.js 自动计算并生成佣金记录。
 * 
 * 安全检查：需要 CHANNEL.MANAGE_COMMISSION 权限
 * P0 Fix: 移除前端传入金额/费率，改为服务端查询并使用 Decimal.js 计算
 * 
 * @param {Object} params - 佣金生成参数
 * @param {string} params.channelId - 渠道ID
 * @param {string} [params.leadId] - 关联的线索ID (可选)
 * @param {string} params.orderId - 订单ID
 * @returns {Promise<any>} 返回新生成的佣金记录
 * @throws {Error} 订单/渠道校验失败，或重复生成佣金则抛出异常
 */
export async function createCommissionRecord(params: {
    channelId: string;
    leadId?: string;
    orderId: string;
}) {
    console.log('[channels] 开始手动生成佣金记录:', params);
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查
    await checkPermission(session, PERMISSIONS.CHANNEL.MANAGE_COMMISSION);

    const tenantId = session.user.tenantId;
    const { channelId, leadId, orderId } = params;

    // P2 Fix: UUID Validation for robustness
    z.string().uuid().parse(channelId);
    z.string().uuid().parse(orderId);
    if (leadId) z.string().uuid().parse(leadId);

    // 验证渠道属于当前租户
    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, channelId), eq(channels.tenantId, tenantId))
    });
    if (!channel) throw new Error('渠道不存在或无权操作');

    // P0 Fix: 获取订单信息
    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
        with: {
            // Need items for BASE_PRICE mode calculation
            items: true
        }
    });
    if (!order) throw new Error('订单不存在');

    // H-05 Fix: Add Idempotency Check BEFORE Calculation
    const existing = await db.query.channelCommissions.findFirst({
        where: and(
            eq(channelCommissions.orderId, orderId),
            eq(channelCommissions.tenantId, tenantId),
            ne(channelCommissions.status, 'VOID')
        )
    });

    if (existing) {
        throw new Error('该订单已存在有效的佣金记录，无法重复创建');
    }

    // Call shared calculation service
    // This ensures consistency with automatic triggers (e.g. Tiered Rates, Smart Rate Detection)
    // Note: Manual creation via this action might override the 'commissionTriggerMode', 
    // effectively forcing a commission generation even if the trigger event hasn't happened yet.
    // This is acceptable for a "Manual Create" administrative action.
    const result = await import('@/features/channels/logic/commission.service')
        .then(m => m.calculateOrderCommission(order, channel));

    if (!result) {
        throw new Error('无法生成佣金记录：计算结果为0或不满足生成条件 (例如: 底价模式下利润为负)');
    }

    const calculationBase = new Decimal(order.totalAmount || 0);

    const [record] = await db.insert(channelCommissions).values({
        tenantId,
        channelId,
        leadId,
        orderId,
        orderAmount: calculationBase.toFixed(2),
        commissionRate: (result.type === 'COMMISSION' ? result.rate : new Decimal(0)).toFixed(4),
        amount: result.amount.toFixed(2),
        commissionType: result.type,
        status: 'PENDING',
        formula: result.formula,
        remark: result.remark,
        createdBy: session.user.id,
    }).returning();

    // P1 Fix: Audit Log
    await AuditService.log(db, {
        tableName: 'channel_commissions',
        recordId: record.id,
        action: 'CREATE',
        userId: session.user.id,
        tenantId,
        newValues: record,
        details: { reason: 'Manual Creation via Action' }
    });

    revalidatePath('/channels');
    return record;
}

/**
 * 获取渠道的佣金记录
 * 
 * 支持按渠道、跨日期和状态分页查询该租户下的佣金明细。
 * 
 * 安全检查：自动从 session 获取 tenantId
 * 
 * @param {Object} params - 查询参数集
 * @param {string} [params.channelId] - 渠道ID过滤
 * @param {'PENDING' | 'SETTLED' | 'PAID' | 'VOID'} [params.status] - 状态过滤
 * @param {Date} [params.startDate] - 开始日期查询
 * @param {Date} [params.endDate] - 结束日期查询
 * @param {number} [params.page] - 页码
 * @param {number} [params.pageSize] - 每页条数
 * @returns {Promise<any>} 返回包含分页数据的佣金记录列表
 */
export async function getChannelCommissions(params: {
    channelId?: string;
    status?: 'PENDING' | 'SETTLED' | 'PAID' | 'VOID';
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const tenantId = session.user.tenantId;
    const { channelId, status, startDate, endDate, page = 1, pageSize = 20 } = params;

    // P3 Fix: Enforce pagination limits
    const limit = Math.min(Math.max(pageSize, 1), 100);

    let whereClause = eq(channelCommissions.tenantId, tenantId);

    if (channelId) {
        whereClause = and(whereClause, eq(channelCommissions.channelId, channelId)) as typeof whereClause;
    }

    if (status) {
        whereClause = and(whereClause, eq(channelCommissions.status, status)) as typeof whereClause;
    }

    if (startDate && endDate) {
        whereClause = and(
            whereClause,
            between(channelCommissions.createdAt, startDate, endDate)
        ) as typeof whereClause;
    }

    const offset = (page - 1) * limit;

    const data = await db.query.channelCommissions.findMany({
        where: whereClause,
        limit: limit,
        offset,
        orderBy: [desc(channelCommissions.createdAt)],
        with: {
            channel: true,
        }
    });

    // 获取总数
    const totalItems = await db.$count(channelCommissions, whereClause);

    return {
        data,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
    };
}

/**
 * 获取待结算的佣金汇总（按渠道分组）
 * 
 * 聚合当前租户所有处于 PENDING（待结算）状态的佣金，按 channelId 维度返回汇总数据。
 * 
 * 安全检查：自动从 session 获取 tenantId
 * 
 * @returns {Promise<any[]>} 返回包含汇总及其关联渠道信息的数组
 */
export async function getPendingCommissionSummary() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const tenantId = session.user.tenantId;

    const result = await db
        .select({
            channelId: channelCommissions.channelId,
            totalAmount: sql<string>`sum(${channelCommissions.amount})`,
            recordCount: sql<number>`count(*)`,
        })
        .from(channelCommissions)
        .where(and(
            eq(channelCommissions.tenantId, tenantId),
            eq(channelCommissions.status, 'PENDING')
        ))
        .groupBy(channelCommissions.channelId);

    // 获取渠道信息
    const channelIds = result.map(r => r.channelId);
    const channelList = channelIds.length > 0
        ? await db.query.channels.findMany({
            where: and(
                eq(channels.tenantId, tenantId),
                inArray(channels.id, channelIds)
            ),
        })
        : [];

    const channelMap = new Map(channelList.map(c => [c.id, c]));

    return result.map(r => ({
        ...r,
        channel: channelMap.get(r.channelId),
    }));
}



/**
 * 作废佣金记录
 * 
 * 根据给定 id 作废处于待结算状态的佣金记录，记录作废原因及审计日志。
 * 
 * 安全检查：需要 CHANNEL.MANAGE_COMMISSION 权限
 * 
 * @param {string} id - 佣金记录ID
 * @param {string} reason - 作废理由备注
 * @returns {Promise<any>} 返回被作废的记录
 * @throws {Error} 未处于 PENDING 状态抛出异常
 */
export async function voidCommission(id: string, reason: string) {
    console.log('[channels] 开始作废佣金记录:', { commissionId: id, reason });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    // 权限检查
    await checkPermission(session, PERMISSIONS.CHANNEL.MANAGE_COMMISSION);

    const tenantId = session.user.tenantId;

    // P2 Fix: Validate reason length
    const validatedReason = z.string().max(500, '备注不能超过500字').parse(reason);

    // 验证状态 (仅允许 VOID 待结算的佣金)
    const commission = await db.query.channelCommissions.findFirst({
        where: and(
            eq(channelCommissions.id, id),
            eq(channelCommissions.tenantId, tenantId)
        ),
        columns: { status: true, amount: true, id: true }
    });

    if (!commission) {
        throw new Error('Commission not found');
    }

    if (commission.status !== 'PENDING') {
        throw new Error('只能作废待结算状态的佣金记录');
    }

    const [updated] = await db.update(channelCommissions)
        .set({ status: 'VOID', remark: validatedReason, updatedAt: new Date() })
        .where(and(
            eq(channelCommissions.id, id),
            eq(channelCommissions.tenantId, tenantId),
            eq(channelCommissions.status, 'PENDING') // Double check
        ))
        .returning();

    // P1 Fix: Audit Log
    await AuditService.log(db, {
        tableName: 'channel_commissions',
        recordId: updated.id,
        action: 'VOID',
        userId: session.user.id,
        tenantId,
        oldValues: { status: 'PENDING' },
        newValues: { status: 'VOID', remark: validatedReason },
        details: { reason: validatedReason }
    });

    revalidatePath('/channels');
    return updated;
}
