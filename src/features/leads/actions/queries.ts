'use server';

import { db } from '@/shared/api/db';
import { leads, leadActivities, users, marketChannels, customers } from '@/shared/api/schema';
import { eq, and, desc, ilike, or, gte, lte, sql, inArray, count } from 'drizzle-orm';
import { z } from 'zod';
import { leadFilterSchema, getLeadTimelineLogsSchema } from '../schemas';

export async function getLeads(input: z.infer<typeof leadFilterSchema>) {
    const filters = leadFilterSchema.parse(input);

    const whereConditions = [];

    // Tenant Filter (Assumed from context or passed, usually headers but for now simple)
    // whereConditions.push(eq(leads.tenantId, tenantId)); 

    // Status Filter
    if (filters.status) {
        whereConditions.push(eq(leads.status, filters.status));
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

export async function getLeadDetail(id: string) {
    const lead = await db.query.leads.findFirst({
        where: eq(leads.id, id),
        with: {
            assignedSales: true,
            sourceChannel: true,
            sourceSub: true,
            customer: true,
            referrerCustomer: true,
        }
    });

    return lead;
}

export async function getLeadById({ id }: { id: string }) {
    const lead = await getLeadDetail(id);
    if (!lead) return { success: false, error: 'Lead not found' };
    return { success: true, data: lead };
}

export async function getLeadTimeline(input: z.infer<typeof getLeadTimelineLogsSchema>) {
    const { leadId } = input;

    const activities = await db.query.leadActivities.findMany({
        where: eq(leadActivities.leadId, leadId),
        with: {
            creator: true,
        },
        orderBy: [desc(leadActivities.createdAt)],
    });

    return activities;
}

export async function getChannels(parentId?: string) {
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

