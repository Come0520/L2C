'use server';

import { db } from '@/shared/api/db';
import { leads, leadActivities, leadStatusHistory, marketChannels, users } from '@/shared/api/schema';
import { eq, and, desc, ilike, or, gte, lte, sql, inArray, count } from 'drizzle-orm';
import { z } from 'zod';
import { leadFilterSchema, getLeadTimelineLogsSchema, analyticsDateRangeSchema } from '../schemas';
import { unstable_cache } from 'next/cache';

import { auth } from '@/shared/lib/auth';
import { escapeSqlLike } from '@/shared/lib/utils';

/**
 * 以分页形式获取线索列表
 * 支持按状态、意向级别、渠道分类、日期范围等进行多维度组合查询
 * 
 * @param {z.infer<typeof leadFilterSchema>} input - 线索查询与过滤条件
 * @returns {Promise<{data: any[], total: number, page: number, pageSize: number, totalPages: number}>} 分页线索数据及元信息
 * @throws {Error} 未登录或缺少租户信息时抛出
 * @audit 依赖 tenantId 进行租户数据隔离
 */
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

/**
 * 根据 ID 获取单条线索详情
 * 包含分配销售、渠道来源及客户详细关联信息
 * 
 * @param {Object} args - 参数对象
 * @param {string} args.id - 线索唯一标识符
 * @returns {Promise<any | null>} 返回线索完整数据，不存在时返回 null
 * @throws {Error} 未登录或缺少租户信息时抛出
 * @audit 依赖 tenantId 进行租户数据严格隔离校验
 */
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

/**
 * 获取指定线索的操作时间线（活动记录）
 * 用于追踪线索从创建、变配、跟进到成交的全生命周期事件
 * 
 * @param {z.infer<typeof getLeadTimelineLogsSchema>} input - 包含线索 ID 的输入参数
 * @returns {Promise<any[]>} 按创建时间倒序排列的活动事件数组
 * @throws {Error} 未登录、缺乏租户信息或线索不可见时抛出
 * @audit 在查询活动前需二次校验当前租户是否拥有该线索访问权限
 */
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
 * 安全修复：添加认证检查，支持根据父节点 ID 获取级联子渠道
 * 
 * @param {string} [parentId] - 选填的父渠道 ID。若无，则查询顶级渠道
 * @returns {Promise<any[]>} 具有给定层级关系的活跃渠道列表
 * @throws {Error} 未登录或缺少租户信息时抛出
 * @audit 依赖 tenantId 隔离企业级字典配置
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

/**
 * 获取系统内的活跃销售人员列表
 * 供线索分配下拉框等选用
 * 
 * @returns {Promise<any[]>} 启用的相关企业下销售用户列表
 * @throws {Error} 未登录或缺少租户信息时抛出
 * @audit 结果局限于同一租户 (tenantId) 内部
 */
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
 * 获取线索转化漏斗统计（分析大盘指标用）
 * 升级版：支持日期范围过滤，并基于线索状态变更历史进行精确阶段转化统计
 * 
 * @param {z.infer<typeof analyticsDateRangeSchema>} [input] - 可选的分析日期范围
 * @returns {Promise<any[]>} 每个线索阶段的新进入计数
 * @throws {Error} 未登录或缺少租户信息时抛出
 * @audit 支持租户及日期下钻审计数据
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
