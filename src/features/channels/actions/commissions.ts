'use server';

import { db } from '@/shared/api/db';
import { channelCommissions, channels } from '@/shared/api/schema/channels';
import { eq, and, desc, between, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

// ==================== 佣金记录 Actions ====================

/**
 * 生成佣金记录（订单完成时调用）
 * 
 * 安全检查：需要 CHANNEL.MANAGE_COMMISSION 权限
 */
export async function createCommissionRecord(params: {
    channelId: string;
    leadId?: string;
    orderId: string;
    orderAmount: number;
    commissionRate: number;
    commissionType: 'BASE_PRICE' | 'COMMISSION';
}) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查
    await checkPermission(session, PERMISSIONS.CHANNEL.MANAGE_COMMISSION);

    const tenantId = session.user.tenantId;
    const { channelId, leadId, orderId, orderAmount, commissionRate, commissionType } = params;

    // 验证渠道属于当前租户
    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, channelId), eq(channels.tenantId, tenantId))
    });
    if (!channel) throw new Error('渠道不存在或无权操作');

    // 计算佣金金额
    const commissionAmount = orderAmount * (commissionRate / 100);

    const [record] = await db.insert(channelCommissions).values({
        tenantId,
        channelId,
        leadId,
        orderId,
        orderAmount: orderAmount.toString(),
        commissionRate: (commissionRate / 100).toFixed(4),  // 转换为小数
        amount: commissionAmount.toFixed(2),
        commissionType,
        status: 'PENDING',
        formula: {
            orderAmount,
            rate: commissionRate,
            calculated: commissionAmount,
            formula: `${orderAmount} × ${commissionRate}% = ${commissionAmount}`,
        },
        createdBy: session.user.id,
    }).returning();

    revalidatePath('/channels');
    return record;
}

/**
 * 获取渠道的佣金记录
 * 
 * 安全检查：自动从 session 获取 tenantId
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

    const offset = (page - 1) * pageSize;

    const data = await db.query.channelCommissions.findMany({
        where: whereClause,
        limit: pageSize,
        offset,
        orderBy: [desc(channelCommissions.createdAt)],
        with: {
            channel: true,
        }
    });

    // 获取总数
    const countResult = await db.query.channelCommissions.findMany({
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
 * 获取待结算的佣金汇总（按渠道分组）
 * 
 * 安全检查：自动从 session 获取 tenantId
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
                sql`${channels.id} = ANY(ARRAY[${sql.raw(channelIds.map(id => `'${id}'`).join(','))}]::uuid[])`
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
 * 安全检查：需要 CHANNEL.MANAGE_COMMISSION 权限
 */
export async function voidCommission(id: string, reason: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查
    await checkPermission(session, PERMISSIONS.CHANNEL.MANAGE_COMMISSION);

    const tenantId = session.user.tenantId;

    const [updated] = await db.update(channelCommissions)
        .set({
            status: 'VOID',
            remark: reason,
            updatedAt: new Date(),
        })
        .where(and(
            eq(channelCommissions.id, id),
            eq(channelCommissions.tenantId, tenantId)
        ))
        .returning();

    revalidatePath('/channels');
    return updated;
}


