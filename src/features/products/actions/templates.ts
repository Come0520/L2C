'use server';

import { db } from '@/shared/api/db';
import { productAttributeTemplates } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { productCategoryEnum } from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 属性字段定义 Schema
 */
const attributeFieldSchema = z.object({
    key: z.string().min(1, 'Key is required').regex(/^[a-zA-Z0-9_]+$/, 'Key must be alphanumeric'),
    label: z.string().min(1, 'Label is required'),
    type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'SELECT', 'DATE', 'TEXTAREA', 'COLOR', 'IMAGE', 'RANGE']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
    unit: z.string().optional(),
    placeholder: z.string().optional(),
    showInQuote: z.boolean().default(false),
    // 扩展字段
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    maxLength: z.number().optional(),
    rows: z.number().optional(),
    description: z.string().optional(),
    defaultValue: z.any().optional(),
});

const templateSchemaZod = z.object({
    category: z.enum(productCategoryEnum.enumValues),
    // templateSchema is now an array of field definitions
    templateSchema: z.array(attributeFieldSchema),
});

const getTemplateSchemaZod = z.object({
    category: z.enum(productCategoryEnum.enumValues),
});

/**
 * 设置或更新品类属性模板
 */
const upsertAttributeTemplateActionInternal = createSafeAction(templateSchemaZod, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.ADMIN.SETTINGS);

    const existing = await db.query.productAttributeTemplates.findFirst({
        where: and(
            eq(productAttributeTemplates.tenantId, session.user.tenantId),
            eq(productAttributeTemplates.category, data.category)
        )
    });

    if (existing) {
        await db.update(productAttributeTemplates)
            .set({
                templateSchema: data.templateSchema, // Stored as JSONB
                updatedAt: new Date()
            })
            .where(eq(productAttributeTemplates.id, existing.id));

        await AuditService.log(db, {
            tenantId: session.user.tenantId,
            userId: session.user.id!,
            tableName: 'product_attribute_templates',
            recordId: existing.id,
            action: 'UPDATE',
            oldValues: { templateSchema: existing.templateSchema },
            newValues: { templateSchema: data.templateSchema }
        });
    } else {
        const [inserted] = await db.insert(productAttributeTemplates).values({
            tenantId: session.user.tenantId,
            category: data.category,
            templateSchema: data.templateSchema,
        }).returning();

        await AuditService.log(db, {
            tenantId: session.user.tenantId,
            userId: session.user.id!,
            tableName: 'product_attribute_templates',
            recordId: inserted.id,
            action: 'CREATE',
            newValues: inserted
        });
    }

    revalidatePath('/settings/products/templates');
    revalidatePath('/supply-chain/products'); // Revalidate product form
    return { success: true };
});

export async function upsertAttributeTemplate(params: z.infer<typeof templateSchemaZod>) {
    return upsertAttributeTemplateActionInternal(params);
}

/**
 * 获取品类属性模板
 */
const getAttributeTemplateActionInternal = createSafeAction(getTemplateSchemaZod, async ({ category }, { session }) => {
    // Both ADMIN and PRODUCTS manager can view templates to render forms
    // checkPermission(session, PERMISSIONS.PRODUCTS.VIEW) || checkPermission(session, PERMISSIONS.ADMIN.SETTINGS) 
    // Optimization: Allow view if user has valid session, specific permission logic can be looser for reading config
    if (!session?.user) throw new Error('Unauthorized');

    const template = await db.query.productAttributeTemplates.findFirst({
        where: and(
            eq(productAttributeTemplates.tenantId, session.user.tenantId),
            eq(productAttributeTemplates.category, category)
        )
    });

    return template || { category, templateSchema: [] };
});

export async function getAttributeTemplate(params: z.infer<typeof getTemplateSchemaZod>) {
    return getAttributeTemplateActionInternal(params);
}

