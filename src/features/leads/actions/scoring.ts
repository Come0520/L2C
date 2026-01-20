'use server';

import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';

// ============================================================
// [Lead-01] 线索评分模型优化
// ============================================================

const calculateLeadScoreSchema = z.object({
    leadId: z.string().uuid(),
});

/**
 * 来源权重配置
 */
const SOURCE_WEIGHTS: Record<string, number> = {
    REFERRAL: 30,        // 转介绍
    REPEAT: 25,          // 老客户复购
    ONLINE_AD: 15,       // 线上广告
    OFFLINE_EVENT: 20,   // 线下活动
    WALK_IN: 10,         // 自然进店
    PHONE_INQUIRY: 12,   // 电话咨询
    OTHER: 5,
};

/**
 * 意向度权重
 */
const INTENTION_WEIGHTS: Record<string, number> = {
    HIGH: 35,
    MEDIUM: 20,
    LOW: 10,
};

/**
 * 计算线索评分
 * 基于：意向度 + 预算 + 来源权重
 */
export const calculateLeadScore = createSafeAction(calculateLeadScoreSchema, async ({ leadId }, { session }) => {
    const tenantId = session.user.tenantId;

    const lead = await db.query.leads.findFirst({
        where: and(
            eq(leads.id, leadId),
            eq(leads.tenantId, tenantId)
        )
    });

    if (!lead) {
        return { error: '线索不存在' };
    }

    // 1. 来源分数 (0-30) - 此处简化为使用默认值，实际应关联查询 channel
    const sourceScore = lead.channelId ? 15 : SOURCE_WEIGHTS['OTHER'];

    // 2. 意向度分数 (0-35)
    const intentionScore = INTENTION_WEIGHTS[lead.intentionLevel || 'LOW'] || 10;

    // 3. 预算分数 (0-35)
    const budget = parseFloat(lead.estimatedAmount?.toString() || '0');
    let budgetScore = 0;
    if (budget >= 50000) {
        budgetScore = 35;
    } else if (budget >= 20000) {
        budgetScore = 28;
    } else if (budget >= 10000) {
        budgetScore = 20;
    } else if (budget >= 5000) {
        budgetScore = 12;
    } else if (budget > 0) {
        budgetScore = 5;
    }

    // 总分 (0-100)
    const totalScore = sourceScore + intentionScore + budgetScore;

    // 星级评定 (1-5星)
    const starRating = totalScore >= 80 ? 5 : totalScore >= 60 ? 4 : totalScore >= 40 ? 3 : totalScore >= 20 ? 2 : 1;

    // 优先级标签
    const priorityLabel = totalScore >= 70 ? '热门线索' : totalScore >= 50 ? '优质线索' : totalScore >= 30 ? '普通线索' : '待培育';

    return {
        leadId,
        score: {
            source: sourceScore,
            intention: intentionScore,
            budget: budgetScore,
            total: totalScore,
        },
        starRating,
        priorityLabel,
        breakdown: {
            sourceLabel: lead.channelId || 'OTHER',
            intentionLabel: lead.intentionLevel || 'LOW',
            budgetAmount: budget,
        }
    };
});

// ============================================================
// [Lead-02] 批量导入去重增强
// ============================================================

const checkDuplicateSchema = z.object({
    phone: z.string().optional(),
    address: z.string().optional(),
    name: z.string().optional(),
});

/**
 * 检查线索是否重复
 * 手机号 + 地址组合去重
 */
export const checkLeadDuplicate = createSafeAction(checkDuplicateSchema, async (params, { session }) => {
    const { phone, address, name } = params;
    const tenantId = session.user.tenantId;

    if (!phone && !address) {
        return { isDuplicate: false, matches: [] };
    }

    const conditions = [eq(leads.tenantId, tenantId)];
    const matchConditions = [];

    // 手机号匹配
    if (phone) {
        matchConditions.push(eq(leads.customerPhone, phone));
    }

    // 地址模糊匹配
    if (address && address.length >= 5) {
        matchConditions.push(ilike(leads.address, `%${address.slice(0, 20)}%`));
    }

    // 姓名匹配（辅助）
    if (name) {
        matchConditions.push(eq(leads.customerName, name));
    }

    if (matchConditions.length === 0) {
        return { isDuplicate: false, matches: [] };
    }

    // 查询可能的重复项
    const potentialDuplicates = await db.query.leads.findMany({
        where: and(
            ...conditions,
            or(...matchConditions)
        ),
        limit: 10,
        columns: {
            id: true,
            customerName: true,
            customerPhone: true,
            address: true,
            status: true,
            createdAt: true,
        }
    });

    // 计算匹配度
    const matches = potentialDuplicates.map(dup => {
        let matchScore = 0;
        const matchReasons = [];

        if (phone && dup.customerPhone === phone) {
            matchScore += 50;
            matchReasons.push('手机号相同');
        }

        if (name && dup.customerName === name) {
            matchScore += 20;
            matchReasons.push('姓名相同');
        }

        if (address && dup.address && dup.address.includes(address.slice(0, 10))) {
            matchScore += 30;
            matchReasons.push('地址相似');
        }

        return {
            ...dup,
            matchScore,
            matchReasons,
            suggestion: matchScore >= 70 ? '建议合并' : matchScore >= 40 ? '可能重复' : '低匹配度',
        };
    }).filter(m => m.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);

    return {
        isDuplicate: matches.some(m => m.matchScore >= 70),
        highConfidenceCount: matches.filter(m => m.matchScore >= 70).length,
        matches,
    };
});

/**
 * 批量检查去重
 */
const batchCheckDuplicateSchema = z.object({
    items: z.array(z.object({
        rowIndex: z.number(),
        phone: z.string().optional(),
        address: z.string().optional(),
        name: z.string().optional(),
    })),
});

export const batchCheckLeadDuplicates = createSafeAction(batchCheckDuplicateSchema, async ({ items }, { session }) => {
    const tenantId = session.user.tenantId;

    // 先收集所有手机号进行批量查询
    const phones = items.map(i => i.phone).filter(Boolean) as string[];

    const existingLeads = phones.length > 0 ? await db.query.leads.findMany({
        where: and(
            eq(leads.tenantId, tenantId),
            or(...phones.map(p => eq(leads.customerPhone, p)))
        ),
        columns: {
            id: true,
            customerName: true,
            customerPhone: true,
            status: true,
        }
    }) : [];

    const phoneMap = new Map(existingLeads.map(l => [l.customerPhone, l]));

    // 检查每一行
    const results = items.map(item => {
        const existing = item.phone ? phoneMap.get(item.phone) : null;
        return {
            rowIndex: item.rowIndex,
            isDuplicate: !!existing,
            existingLead: existing ? {
                id: existing.id,
                name: existing.customerName,
                status: existing.status,
            } : null,
            suggestion: existing ? '手机号已存在，建议跳过或合并' : null,
        };
    });

    return {
        totalChecked: items.length,
        duplicateCount: results.filter(r => r.isDuplicate).length,
        uniqueCount: results.filter(r => !r.isDuplicate).length,
        results,
    };
});
