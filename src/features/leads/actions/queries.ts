'use server';

import { db } from '@/shared/api/db';
import { leads, leadActivities, marketChannels } from '@/shared/api/schema';
import { eq, and, desc, ilike, or, gte, lte, sql, inArray, count } from 'drizzle-orm';
import { z } from 'zod';
import { leadFilterSchema, getLeadTimelineLogsSchema } from '../schemas';
import { auth } from '@/shared/lib/auth';

export async function getLeads(input: z.infer<typeof leadFilterSchema>) {
    // 认证检查：获取当前用户的租户 ID
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    const tenantId = session.user.tenantId;

    const filters = leadFilterSchema.parse(input);

    const whereConditions = [];

    // 租户隔离：必须过滤租户 ID
    whereConditions.push(eq(leads.tenantId, tenantId));

    // Status Filter
    if (filters.status && filters.status.length > 0) {
        // 类型断言：leadFilterSchema 中已限制 status 值为有效的 leadStatusEnum 值
        whereConditions.push(inArray(leads.status, filters.status as ("PENDING_ASSIGNMENT" | "PENDING_FOLLOWUP" | "FOLLOWING_UP" | "WON" | "VOID" | "INVALID")[]));
    }

    // Intention Level Filter
    if (filters.intentionLevel) {
        whereConditions.push(eq(leads.intentionLevel, filters.intentionLevel));
    }

    // Search (Name, Phone, LeadNo)
    if (filters.search) {
        whereConditions.push(or(
            ilike(leads.customerName, `%${filters.search}%`),
            ilike(leads.customerPhone, `%${filters.search}%`),
            ilike(leads.leadNo, `%${filters.search}%`),
            ilike(leads.community, `%${filters.search}%`)
        ));
    }

    // Sales Filter
    if (filters.salesId) {
        if (filters.salesId === 'UNASSIGNED') {
            whereConditions.push(sql`${leads.assignedSalesId} IS NULL`);
        } else {
            whereConditions.push(eq(leads.assignedSalesId, filters.salesId));
        }
    }

    // Channel Filter
    if (filters.sourceCategoryId) {
        whereConditions.push(or(
            eq(leads.sourceChannelId, filters.sourceCategoryId),
            eq(leads.sourceSubId, filters.sourceCategoryId)
        ));
    }

    // Date Range Filter
    if (filters.dateRange?.from) {
        whereConditions.push(gte(leads.createdAt, filters.dateRange.from));
    }
    if (filters.dateRange?.to) {
        whereConditions.push(lte(leads.createdAt, filters.dateRange.to));
    }

    // Tags Filter
    if (filters.tags && filters.tags.length > 0) {
        whereConditions.push(sql`${leads.tags} && ${filters.tags}`);
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
        limit: filters.pageSize,
        offset: (filters.page - 1) * filters.pageSize,
    });

    return {
        data: rows,
        total: total?.count || 0,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.ceil((total?.count || 0) / filters.pageSize),
    };
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
    // 认证检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: 'Unauthorized' };
    }

    const lead = await getLeadDetailInternal(id, session.user.tenantId);
    if (!lead) return { success: false, error: 'Lead not found' };
    return { success: true, data: lead };
}

export async function getLeadTimeline(input: z.infer<typeof getLeadTimelineLogsSchema>) {
    // 认证检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }

    const { leadId } = input;

    // 验证线索属于当前租户
    const lead = await db.query.leads.findFirst({
        where: and(
            eq(leads.id, leadId),
            eq(leads.tenantId, session.user.tenantId)
        ),
        columns: { id: true }
    });

    if (!lead) {
        throw new Error('Lead not found or access denied');
    }

    const activities = await db.query.leadActivities.findMany({
        where: eq(leadActivities.leadId, leadId),
        with: {
            creator: true,
        },
        orderBy: [desc(leadActivities.createdAt)],
    });

    return activities;
}

/**
 * 获取市场渠道列表
 * 安全修复：添加认证检查
 */
export async function getChannels(parentId?: string) {
    // 认证检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }

    const where = parentId
        ? eq(marketChannels.parentId, parentId)
        : sql`${marketChannels.parentId} IS NULL`; // Top level

    const rows = await db.query.marketChannels.findMany({
        where: and(
            where,
            eq(marketChannels.isActive, true)
        ),
        orderBy: [desc(marketChannels.sortOrder)],
    });
    return rows;
}

