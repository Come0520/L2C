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

/**
 * 内部操作：将现有报价单保存为模板
 * @param data 包含源报价单ID和模板信息的请求对象
 * @param context 执行上下文，包含租户信息
 */
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

/**
 * 客户端调用：将报价单保存为模板
 * @param params 模板配置参数
 */
export async function saveQuoteAsTemplate(params: z.infer<typeof saveQuoteAsTemplateSchema>) {
    return saveQuoteAsTemplateActionInternal(params);
}

const createQuoteFromTemplateSchema = z.object({
    templateId: z.string().uuid(),
    customerId: z.string().uuid()
});

/**
 * 内部操作：使用指定模板为客户创建新报价单
 * @param data 包含模板ID和客户ID的请求对象
 * @param context 执行上下文
 */
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

/**
 * 客户端调用：从模板创建报价单
 * @param params 包含模板ID和客户ID的参数
 */
export async function createQuoteFromTemplate(params: z.infer<typeof createQuoteFromTemplateSchema>) {
    return createQuoteFromTemplateActionInternal(params);
}

const getQuoteTemplatesSchema = z.object({
    excludeId: z.string().uuid().optional(),
    category: z.string().optional()
});

/**
 * 内部操作：获取所有可用的报价模板列表及分类
 * @param data 查询过滤参数
 * @param context 执行上下文
 */
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

/**
 * 客户端调用：获取报价模板列表
 * @param params 过滤参数
 */
export async function getQuoteTemplates(params: z.infer<typeof getQuoteTemplatesSchema>) {
    return getQuoteTemplatesActionInternal(params);
}

const getQuoteTemplateSchema = z.object({
    templateId: z.string().uuid()
});

/**
 * 内部操作：获取特定报价模板详细信息
 * @param data 包含模板ID的请求对象
 * @param context 执行上下文
 */
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

/**
 * 客户端调用：获取报价模板详情
 * @param params 包含模板ID的参数
 */
export async function getQuoteTemplate(params: z.infer<typeof getQuoteTemplateSchema>) {
    return getQuoteTemplateActionInternal(params);
}

const deleteQuoteTemplateSchema = z.object({
    templateId: z.string().uuid()
});

/**
 * 内部操作：删除特定的报价模板
 * @param data 包含模板ID的请求对象
 * @param context 执行上下文
 */
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

/**
 * 客户端调用：删除报价模板
 * @param params 包含模板ID的参数
 */
export async function deleteQuoteTemplate(params: z.infer<typeof deleteQuoteTemplateSchema>) {
    return deleteQuoteTemplateActionInternal(params);
}

const applyQuoteTemplateSchema = z.object({
    templateId: z.string().uuid()
});

/**
 * 内部操作：将模板应用到当前报价单以获取预填充数据
 * @param data 包含模板ID的请求对象
 * @param context 执行上下文
 */
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

/**
 * 客户端调用：拉取模板数据供前端预填充使用
 * @param params 包含模板ID的参数
 */
export async function applyQuoteTemplate(params: z.infer<typeof applyQuoteTemplateSchema>) {
    return applyQuoteTemplateActionInternal(params);
}
