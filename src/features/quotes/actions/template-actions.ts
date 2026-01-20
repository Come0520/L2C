'use server';

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

// ============================================================
// [Quote-01] 报价模板库
// ============================================================

/**
 * 报价模板存储在数据库或本地存储
 * 由于可能没有专门的 quoteTemplates 表，这里使用内存+JSON 方案
 * 实际生产环境可扩展为数据库表
 */

// 临时存储方案（实际应使用数据库）
const templateStorage = new Map<string, QuoteTemplate[]>();

interface QuoteTemplate {
    id: string;
    name: string;
    description?: string;
    category: string;
    items: QuoteTemplateItem[];
    createdAt: Date;
    createdBy: string;
}

interface QuoteTemplateItem {
    productId?: string;
    productName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    attributes?: Record<string, unknown>;
}

const saveQuoteTemplateSchema = z.object({
    name: z.string().min(1, '模板名称不能为空'),
    description: z.string().optional(),
    category: z.string().default('通用'),
    items: z.array(z.object({
        productId: z.string().optional(),
        productName: z.string(),
        category: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        attributes: z.record(z.string(), z.unknown()).optional(),
    })),
});

/**
 * 保存报价配置为模板
 */
export const saveQuoteAsTemplate = createSafeAction(saveQuoteTemplateSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.QUOTE.EDIT);
    const tenantId = session.user.tenantId;

    const template: QuoteTemplate = {
        id: `TPL-${Date.now()}`,
        name: data.name,
        description: data.description,
        category: data.category,
        items: data.items,
        createdAt: new Date(),
        createdBy: session.user.id!,
    };

    // 获取租户模板列表
    const tenantTemplates = templateStorage.get(tenantId) || [];
    tenantTemplates.push(template);
    templateStorage.set(tenantId, tenantTemplates);

    return {
        success: true,
        templateId: template.id,
        message: `模板 "${data.name}" 保存成功`,
    };
});

const getQuoteTemplatesSchema = z.object({
    category: z.string().optional(),
});

/**
 * 获取报价模板列表
 */
export const getQuoteTemplates = createSafeAction(getQuoteTemplatesSchema, async ({ category }, { session }) => {
    await checkPermission(session, PERMISSIONS.QUOTE.VIEW);
    const tenantId = session.user.tenantId;

    const tenantTemplates = templateStorage.get(tenantId) || [];

    // 按分类筛选
    const filtered = category
        ? tenantTemplates.filter(t => t.category === category)
        : tenantTemplates;

    return {
        templates: filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        total: filtered.length,
        categories: [...new Set(tenantTemplates.map(t => t.category))],
    };
});

const applyQuoteTemplateSchema = z.object({
    templateId: z.string(),
});

/**
 * 一键应用模板
 */
export const applyQuoteTemplate = createSafeAction(applyQuoteTemplateSchema, async ({ templateId }, { session }) => {
    await checkPermission(session, PERMISSIONS.QUOTE.EDIT);
    const tenantId = session.user.tenantId;

    const tenantTemplates = templateStorage.get(tenantId) || [];
    const template = tenantTemplates.find(t => t.id === templateId);

    if (!template) {
        return { error: '模板不存在' };
    }

    // 返回模板内容，前端用于填充报价表单
    return {
        success: true,
        template: {
            name: template.name,
            items: template.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                attributes: item.attributes,
                // 计算小计
                subtotal: item.quantity * item.unitPrice,
            })),
        },
        message: `已应用模板 "${template.name}"`,
    };
});

const deleteQuoteTemplateSchema = z.object({
    templateId: z.string(),
});

/**
 * 删除模板
 */
export const deleteQuoteTemplate = createSafeAction(deleteQuoteTemplateSchema, async ({ templateId }, { session }) => {
    await checkPermission(session, PERMISSIONS.QUOTE.DELETE);
    const tenantId = session.user.tenantId;

    const tenantTemplates = templateStorage.get(tenantId) || [];
    const index = tenantTemplates.findIndex(t => t.id === templateId);

    if (index === -1) {
        return { error: '模板不存在' };
    }

    const deleted = tenantTemplates.splice(index, 1)[0];
    templateStorage.set(tenantId, tenantTemplates);

    return {
        success: true,
        message: `已删除模板 "${deleted.name}"`,
    };
});

// ============================================================
// [Quote-02] AI 报价助手（简化实现）
// ============================================================

const getQuoteRecommendationsSchema = z.object({
    customerType: z.enum(['个人', '企业', '设计师']).optional(),
    budget: z.number().optional(),
    roomType: z.string().optional(), // 卧室/客厅/阳台等
    style: z.string().optional(), // 现代/简约/轻奢等
});

/**
 * 智能推荐产品组合
 * 基于客户类型、预算、房间类型等推荐合适的产品
 */
export const getQuoteRecommendations = createSafeAction(getQuoteRecommendationsSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.QUOTE.VIEW);

    // 简化的推荐逻辑（实际应从数据库查询热门产品）
    const recommendations = [];

    // 根据预算推荐
    if (params.budget) {
        if (params.budget >= 50000) {
            recommendations.push({
                label: '高端套餐',
                products: [
                    { name: '进口实木窗帘杆', suggestedQty: 2, priceRange: '800-1500' },
                    { name: '真丝遮光窗帘', suggestedQty: 4, priceRange: '1200-2500' },
                    { name: '智能电动轨道', suggestedQty: 2, priceRange: '2000-3500' },
                ],
            });
        } else if (params.budget >= 20000) {
            recommendations.push({
                label: '品质套餐',
                products: [
                    { name: '铝合金窗帘杆', suggestedQty: 2, priceRange: '300-600' },
                    { name: '定制棉麻窗帘', suggestedQty: 4, priceRange: '400-800' },
                    { name: '手动静音轨道', suggestedQty: 2, priceRange: '200-400' },
                ],
            });
        } else {
            recommendations.push({
                label: '经济套餐',
                products: [
                    { name: '罗马杆', suggestedQty: 2, priceRange: '100-200' },
                    { name: '成品窗帘', suggestedQty: 4, priceRange: '150-300' },
                ],
            });
        }
    }

    // 根据房间类型推荐
    if (params.roomType) {
        const roomRecommendations: Record<string, { label: string; tip: string }> = {
            '卧室': { label: '卧室推荐', tip: '建议选择遮光性好的布帘+纱帘组合' },
            '客厅': { label: '客厅推荐', tip: '建议选择大气美观的落地窗帘' },
            '阳台': { label: '阳台推荐', tip: '建议选择防水耐晒的百叶或卷帘' },
            '书房': { label: '书房推荐', tip: '建议选择简约款式，避免干扰视线' },
        };

        if (roomRecommendations[params.roomType]) {
            recommendations.push(roomRecommendations[params.roomType]);
        }
    }

    return {
        recommendations,
        tips: [
            '建议测量窗户实际尺寸后再下单',
            '窗帘宽度通常为窗户宽度的 1.5-2 倍',
            '高层住户建议选择抗风性好的轨道',
        ],
    };
});
