'use server';

import { logger } from "@/shared/lib/logger";

import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { escapeSqlLike } from '@/shared/lib/utils';
import {
    INTENTION_WEIGHTS,
    DEFAULT_SOURCE_SCORE,
    UNKNOWN_CHANNEL_SCORE,
    DEFAULT_INTENTION_SCORE,
    calculateBudgetScore,
    getStarRating,
    getPriorityLabel
} from '../config/scoring-config';

// ============================================================
// [Lead-01] 线索评分模型优化
// ============================================================

const calculateLeadScoreSchema = z.object({
    leadId: z.string().uuid(),
});

// 评分权重配置已移至 ../config/scoring-config.ts

/**
 * 计算线索评分
 * 基于：意向度 + 预算 + 来源权重
 */
const calculateLeadScoreInternal = createSafeAction(calculateLeadScoreSchema, async ({ leadId }, { session }) => {
    const tenantId = session.user.tenantId;
    logger.info('[leads] 计算线索评分开始:', { leadId, tenantId });

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
    const sourceScore = lead.channelId ? UNKNOWN_CHANNEL_SCORE : DEFAULT_SOURCE_SCORE;

    // 2. 意向度分数 (0-35)
    const intentionScore = INTENTION_WEIGHTS[lead.intentionLevel || 'LOW'] || DEFAULT_INTENTION_SCORE;

    // 3. 预算分数 (0-35)
    const budget = parseFloat(lead.estimatedAmount?.toString() || '0');
    const budgetScore = calculateBudgetScore(budget);

    // 总分 (0-100)
    const totalScore = sourceScore + intentionScore + budgetScore;

    // 星级评定 (1-5星)
    const starRating = getStarRating(totalScore);

    // 优先级标签
    const priorityLabel = getPriorityLabel(totalScore);

    logger.info('[leads] 计算线索评分成功:', { leadId, tenantId, totalScore, starRating });

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

/**
 * 对外暴露的 Server Action：计算线索评分
 * 
 * 依据来源、意向级别和预算信息打分，并返回星级和处理优先级。
 *
 * @param {z.infer<typeof calculateLeadScoreSchema>} data - 包含线索 ID 的输入负载
 * @returns {Promise<import('../types').LeadScoreResult | {error: string}>} 评分结果或错误信息
 */
export async function calculateLeadScore(data: z.infer<typeof calculateLeadScoreSchema>) {
    return calculateLeadScoreInternal(data);
}

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
const checkLeadDuplicateInternal = createSafeAction(checkDuplicateSchema, async (params, { session }) => {
    const { phone, address, name } = params;
    const tenantId = session.user.tenantId;
    logger.info('[leads] 检查线索去重开始:', { phone, address, name, tenantId });

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
        matchConditions.push(ilike(leads.address, `%${escapeSqlLike(address.slice(0, 20))}%`));
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

    const isDuplicateMatch = matches.some(m => m.matchScore >= 70);
    logger.info('[leads] 检查线索去重结果:', { isDuplicate: isDuplicateMatch, matchCount: matches.length, tenantId });

    return {
        isDuplicate: isDuplicateMatch,
        highConfidenceCount: matches.filter(m => m.matchScore >= 70).length,
        matches,
    };
});

/**
 * 对外暴露的 Server Action：检测当前线索是否存在重复
 * 
 * @param {z.infer<typeof checkDuplicateSchema>} data - 需检测的电话、地址、姓名
 * @returns {Promise<any>} 返回查重详情与可能存在的重复线索列表
 */
export async function checkLeadDuplicate(data: z.infer<typeof checkDuplicateSchema>) {
    return checkLeadDuplicateInternal(data);
}

/**
 * 批量检查去重
 */
const batchCheckDuplicateSchema = z.object({
    items: z.array(z.object({
        rowIndex: z.number(),
        phone: z.string().optional(),
        address: z.string().optional(),
        name: z.string().optional(),
    })).max(500, '每次最多支持500条数据'),
});

const batchCheckLeadDuplicatesInternal = createSafeAction(batchCheckDuplicateSchema, async ({ items }, { session }) => {
    const tenantId = session.user.tenantId;
    logger.info('[leads] 批量检查线索去重开始:', { itemCount: items.length, tenantId });

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

    const duplicateCount = results.filter(r => r.isDuplicate).length;
    logger.info('[leads] 批量检查线索去重结果:', { totalChecked: items.length, duplicateCount, tenantId });

    return {
        totalChecked: items.length,
        duplicateCount,
        uniqueCount: results.filter(r => !r.isDuplicate).length,
        results,
    };
});

/**
 * 对外暴露的 Server Action：批量检查当前线索是否存在重复
 * 
 * @param {z.infer<typeof batchCheckDuplicateSchema>} data - 线索批量列表
 * @returns {Promise<any>}
 */
export async function batchCheckLeadDuplicates(data: z.infer<typeof batchCheckDuplicateSchema>) {
    return batchCheckLeadDuplicatesInternal(data);
}
