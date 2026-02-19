'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createSafeAction } from '@/shared/lib/server-action';
import { QuoteTemplateService } from '@/services/quote-template.service';
import { AuditService } from '@/shared/lib/audit-service';

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
        const tenantId = context.session.user.tenantId; // Get tenantId
        if (!tenantId) throw new Error('Unauthorized');

        const template = await QuoteTemplateService.saveAsTemplate(
            data.quoteId,
            data.name,
            data.description,
            context.session.user.id,
            tenantId, // Pass tenantId
            {
                category: data.category,
                tags: data.tags,
                isPublic: data.isPublic
            }
        );

        revalidatePath('/quotes/templates');

        // 审计日志：记录模板保存
        await AuditService.recordFromSession(context.session, 'quoteTemplates', template.id, 'CREATE', {
            new: { name: data.name, sourceQuoteId: data.quoteId },
        });

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
        const tenantId = context.session.user.tenantId; // Get tenantId
        if (!tenantId) throw new Error('Unauthorized');

        const quote = await QuoteTemplateService.createQuoteFromTemplate(
            data.templateId,
            data.customerId,
            context.session.user.id,
            tenantId // Pass tenantId
        );

        revalidatePath('/quotes');
        revalidatePath(`/quotes/${quote.id}`);

        // 审计日志：记录从模板创建报价
        await AuditService.recordFromSession(context.session, 'quotes', quote.id, 'CREATE', {
            new: { templateId: data.templateId, customerId: data.customerId },
        });

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
    excludeId: z.string().uuid().optional(),
    category: z.string().optional()
});

const getQuoteTemplatesActionInternal = createSafeAction(
    getQuoteTemplatesSchema,
    async (data, context) => {
        const tenantId = context.session.user.tenantId;
        if (!tenantId) throw new Error('Unauthorized');

        const result = await QuoteTemplateService.getTemplates(tenantId, data);

        // Map to UI model
        const mappedTemplates = result.templates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            tags: t.tags,
            isPublic: t.isPublic,
            createdAt: t.createdAt,
            creator: t.creator,
            itemCount: t.items.length,
            roomCount: t.rooms.length
        }));

        return {
            templates: mappedTemplates,
            categories: result.categories
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
    async (data, context) => { // Rename _context to context
        const tenantId = context.session.user.tenantId;
        if (!tenantId) throw new Error('Unauthorized');

        const template = await QuoteTemplateService.getTemplate(data.templateId, tenantId); // Pass tenantId
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
    async (data, context) => { // Rename _context to context
        const tenantId = context.session.user.tenantId;
        if (!tenantId) throw new Error('Unauthorized');

        await QuoteTemplateService.deleteTemplate(data.templateId, tenantId); // Pass tenantId

        // 审计日志：记录模板删除
        await AuditService.recordFromSession(context.session, 'quoteTemplates', data.templateId, 'DELETE');

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
    async (data, context) => { // Rename _context to context
        const tenantId = context.session.user.tenantId;
        if (!tenantId) throw new Error('Unauthorized');

        const template = await QuoteTemplateService.getTemplate(data.templateId, tenantId); // Pass tenantId
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
