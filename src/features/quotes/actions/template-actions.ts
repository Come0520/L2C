'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSafeAction } from '@/shared/lib/server-action';
import { QuoteTemplateService } from '@/services/quote-template.service';

/**
 * 报价模板 Server Actions
 * 基于数据库的持久化实现
 */

const saveQuoteAsTemplateSchema = z.object({
    quoteId: z.string().uuid(),
    name: z.string().min(1, '模板名称不能为空').max(200),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional()
});

const saveQuoteAsTemplateActionInternal = createSafeAction(
    saveQuoteAsTemplateSchema,
    async (data, context) => {
        const template = await QuoteTemplateService.saveAsTemplate(
            data.quoteId,
            data.name,
            data.description,
            context.session.user.id,
            {
                category: data.category,
                tags: data.tags,
                isPublic: data.isPublic
            }
        );

        revalidatePath('/quotes/templates');
        return {
            success: true,
            templateId: template.id,
            message: `模板 "${data.name}" 保存成功`
        };
    }
);

export async function saveQuoteAsTemplate(params: z.infer<typeof saveQuoteAsTemplateSchema>) {
    return saveQuoteAsTemplateActionInternal(params);
}

const createQuoteFromTemplateSchema = z.object({
    templateId: z.string().uuid(),
    customerId: z.string().uuid()
});

const createQuoteFromTemplateActionInternal = createSafeAction(
    createQuoteFromTemplateSchema,
    async (data, context) => {
        const quote = await QuoteTemplateService.createQuoteFromTemplate(
            data.templateId,
            data.customerId,
            context.session.user.id
        );

        revalidatePath('/quotes');
        revalidatePath(`/quotes/${quote.id}`);
        return {
            success: true,
            quoteId: quote.id,
            quoteNo: quote.quoteNo
        };
    }
);

export async function createQuoteFromTemplate(params: z.infer<typeof createQuoteFromTemplateSchema>) {
    return createQuoteFromTemplateActionInternal(params);
}

const getQuoteTemplatesSchema = z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().optional(),
    offset: z.number().optional()
});

const getQuoteTemplatesActionInternal = createSafeAction(
    getQuoteTemplatesSchema,
    async (data, context) => {
        const templates = await QuoteTemplateService.getTemplates(
            context.session.user.tenantId,
            {
                ...data,
                userId: context.session.user.id,
                includePublic: true
            }
        );

        return {
            templates,
            total: templates.length,
            categories: [...new Set(templates.map(t => t.category).filter(Boolean))]
        };
    }
);

export async function getQuoteTemplates(params: z.infer<typeof getQuoteTemplatesSchema>) {
    return getQuoteTemplatesActionInternal(params);
}

const getQuoteTemplateSchema = z.object({
    templateId: z.string().uuid()
});

const getQuoteTemplateActionInternal = createSafeAction(
    getQuoteTemplateSchema,
    async (data, _context) => {
        const template = await QuoteTemplateService.getTemplate(data.templateId);
        if (!template) {
            throw new Error('模板不存在');
        }
        return template;
    }
);

export async function getQuoteTemplate(params: z.infer<typeof getQuoteTemplateSchema>) {
    return getQuoteTemplateActionInternal(params);
}

const deleteQuoteTemplateSchema = z.object({
    templateId: z.string().uuid()
});

const deleteQuoteTemplateActionInternal = createSafeAction(
    deleteQuoteTemplateSchema,
    async (data, _context) => {
        await QuoteTemplateService.deleteTemplate(data.templateId);
        revalidatePath('/quotes/templates');
        return { success: true, message: '模板已删除' };
    }
);

export async function deleteQuoteTemplate(params: z.infer<typeof deleteQuoteTemplateSchema>) {
    return deleteQuoteTemplateActionInternal(params);
}

const applyQuoteTemplateSchema = z.object({
    templateId: z.string().uuid()
});

const applyQuoteTemplateActionInternal = createSafeAction(
    applyQuoteTemplateSchema,
    async (data, _context) => {
        const template = await QuoteTemplateService.getTemplate(data.templateId);
        if (!template) {
            throw new Error('模板不存在');
        }

        // 返回模板数据用于前端预填充
        return {
            template: {
                id: template.id,
                name: template.name,
                rooms: template.rooms.map(room => ({
                    name: room.name,
                    sortOrder: room.sortOrder
                })),
                items: template.items.map(item => ({
                    roomId: item.roomId,
                    category: item.category,
                    productId: item.productId,
                    productName: item.productName,
                    defaultWidth: item.defaultWidth,
                    defaultHeight: item.defaultHeight,
                    defaultFoldRatio: item.defaultFoldRatio,
                    unitPrice: item.unitPrice,
                    attributes: item.attributes
                }))
            },
            message: `已应用模板 "${template.name}"`
        };
    }
);

export async function applyQuoteTemplate(params: z.infer<typeof applyQuoteTemplateSchema>) {
    return applyQuoteTemplateActionInternal(params);
}
