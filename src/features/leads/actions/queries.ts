'use server';

import { db } from '@/shared/api/db';
import { leads, leadActivities, leadStatusHistory, marketChannels, users } from '@/shared/api/schema';
import { eq, and, desc, ilike, or, gte, lte, sql, inArray, count } from 'drizzle-orm';
import { z } from 'zod';
import { leadFilterSchema, getLeadTimelineLogsSchema, analyticsDateRangeSchema } from '../schemas';
import { unstable_cache } from 'next/cache';

import { auth } from '@/shared/lib/auth';
import { escapeSqlLike } from '@/shared/lib/utils';

export async function getLeads(input: z.infer<typeof leadFilterSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    const tenantId = session.user.tenantId;
    const filters = leadFilterSchema.parse(input);

    return unstable_cache(
        async (f: z.infer<typeof leadFilterSchema>) => {
            const whereConditions = [];
            whereConditions.push(eq(leads.tenantId, tenantId));

            if (f.status && f.status.length > 0) {
                whereConditions.push(inArray(leads.status, f.status as ("PENDING_ASSIGNMENT" | "PENDING_FOLLOWUP" | "FOLLOWING_UP" | "WON" | "INVALID")[]));
            }

            if (f.intentionLevel) {
                whereConditions.push(eq(leads.intentionLevel, f.intentionLevel));
            }

            if (f.search) {
                const keyword = escapeSqlLike(f.search);
                whereConditions.push(or(
                    ilike(leads.customerName, `%${keyword}%`),
                    ilike(leads.customerPhone, `%${keyword}%`),
                    ilike(leads.leadNo, `%${keyword}%`),
                    ilike(leads.community, `%${keyword}%`)
                ));
            }

            if (f.salesId) {
                if (f.salesId === 'UNASSIGNED') {
                    whereConditions.push(sql`${leads.assignedSalesId} IS NULL`);
                } else {
                    whereConditions.push(eq(leads.assignedSalesId, f.salesId));
                }
            }

            if (f.sourceCategoryId) {
                whereConditions.push(or(
                    eq(leads.sourceChannelId, f.sourceCategoryId),
                    eq(leads.sourceSubId, f.sourceCategoryId)
                ));
            }

            if (f.dateRange?.from) {
                whereConditions.push(gte(leads.createdAt, f.dateRange.from));
            }
            if (f.dateRange?.to) {
                whereConditions.push(lte(leads.createdAt, f.dateRange.to));
            }

            if (f.tags && f.tags.length > 0) {
                whereConditions.push(sql`${leads.tags} && ${f.tags}`);
            }

            const whereClause = and(...whereConditions);

            const [total] = await db
                .select({ count: count() })
                .from(leads)
                .where(whereClause);

            const rows = await db.query.leads.findMany({
                where: whereClause,
                with: {
                    assignedSales: true,
                    sourceChannel: true,
                    sourceSub: true,
                    customer: true,
                },
                orderBy: [desc(leads.createdAt)],
                limit: f.pageSize,
                offset: (f.page - 1) * f.pageSize,
            });

            return {
                data: rows,
                total: total?.count || 0,
                page: f.page,
                pageSize: f.pageSize,
                totalPages: Math.ceil((total?.count || 0) / f.pageSize),
            };
        },
        [`leads-${tenantId}-${JSON.stringify(filters)}`],
        {
            tags: [`leads-${tenantId}`, 'leads'],
            revalidate: 30, // 30 seconds for lead list
        }
    )(filters);
}

/**
 * 获取线索详情（内部函数，不直接暴露）
 * 调用者负责确保 tenantId 来自可信来源
 * @param id 线索 ID
 * @param tenantId 租户 ID（由调用者从 session 获取）
 */
async function getLeadDetailInternal(id: string, tenantId: string) {
    const lead = await db.query.leads.findFirst({
        where: and(
            eq(leads.id, id),
            eq(leads.tenantId, tenantId)  // 租户隔离
        ),
        with: {
            assignedSales: true,
            sourceChannel: true,
            sourceSub: true,
            customer: true,
            referrerCustomer: true,
            creator: true,
        }
    });
    return lead;
}

export async function getLeadById({ id }: { id: string }) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized');
    }
    const tenantId = session.user.tenantId;

    const lead = await unstable_cache(
        async (lId: string, tId: string) => {
            return await getLeadDetailInternal(lId, tId);
        },
        [`lead-${tenantId}-${id}`],
        {
            tags: [`lead-${tenantId}-${id}`, `leads-${tenantId}`],
            revalidate: 60,
        }
    )(id, tenantId);

    if (!lead) return null;
    return lead;
}

export async function getLeadTimeline(input: z.infer<typeof getLeadTimelineLogsSchema>) {
    // 认证检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    const tenantId = session.user.tenantId;
    const { leadId } = input;

    return unstable_cache(
        async (lId: string) => {
            // 验证线索属于当前租户
            const lead = await db.query.leads.findFirst({
                where: and(
                    eq(leads.id, lId),
                    eq(leads.tenantId, tenantId)
                ),
                columns: { id: true }
            });

            if (!lead) {
                throw new Error('Lead not found or access denied');
            }

            const activities = await db.query.leadActivities.findMany({
                where: eq(leadActivities.leadId, lId),
                with: {
                    creator: true,
                },
                orderBy: [desc(leadActivities.createdAt)],
            });

            return activities;
        },
        [`lead-timeline-${tenantId}-${leadId}`],
        {
            tags: [`lead-timeline-${tenantId}-${leadId}`, `leads-${tenantId}`],
            revalidate: 60,
        }
    )(leadId);
}

/**
 * 获取市场渠道列表
 * 安全修复：添加认证检查
 */
export async function getChannels(parentId?: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async (pId?: string) => {
            const where = pId
                ? eq(marketChannels.parentId, pId)
                : sql`${marketChannels.parentId} IS NULL`;

            const rows = await db.query.marketChannels.findMany({
                where: and(
                    where,
                    eq(marketChannels.isActive, true),
                    eq(marketChannels.tenantId, tenantId)
                ),
                orderBy: [desc(marketChannels.sortOrder)],
            });
            return rows;
        },
        [`channels-${tenantId}-${parentId || 'root'}`],
        {
            tags: [`channels-${tenantId}`, 'channels'],
            revalidate: 300, // 5 minutes
        }
    )(parentId);
}

export async function getSalesUsers() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized');
    }
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const salesUsers = await db.query.users.findMany({
                where: and(
                    eq(users.tenantId, tenantId),
                    eq(users.isActive, true)
                ),
                columns: {
                    id: true,
                    name: true,
                    role: true,
                },
            });

            return salesUsers.map(user => ({
                ...user,
                name: user.name || 'Unknown User'
            }));
        },
        [`sales-users-${tenantId}`],
        {
            tags: [`sales-users-${tenantId}`, 'users'],
            revalidate: 300, // 5 minutes
        }
    )();
}

/**
 * 获取线索转化漏斗统计
 * 升级版：支持日期范围过滤，并基于线索状态变更历史进行统计
 */
export async function getLeadFunnelStats(input?: z.infer<typeof analyticsDateRangeSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    const tenantId = session.user.tenantId;
    const range = input ? analyticsDateRangeSchema.parse(input) : {};

    return unstable_cache(
        async (r) => {
            const whereConditions = [eq(leadStatusHistory.tenantId, tenantId)];
            if (r.from) whereConditions.push(gte(leadStatusHistory.changedAt, r.from));
            if (r.to) whereConditions.push(lte(leadStatusHistory.changedAt, r.to));

            // 统计在指定时间段内，各状态的去重流入线索数
            // 例如：只要有个线索在 1 月份从 'NEW' 变更为 'FOLLOWING_UP'，它就会计入 'FOLLOWING_UP' 阶段
            const stats = await db
                .select({
                    status: leadStatusHistory.newStatus,
                    count: count(sql`DISTINCT ${leadStatusHistory.leadId}`),
                })
                .from(leadStatusHistory)
                .where(and(...whereConditions))
                .groupBy(leadStatusHistory.newStatus);

            return stats;
        },
        [`leads-funnel-${tenantId}-${JSON.stringify(range)}`],
        {
            tags: [`leads-${tenantId}`],
            revalidate: 60, // 1 minute
        }
    )(range);
}
