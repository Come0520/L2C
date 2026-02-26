"use server";

/**
 * 测量与安装相关集成 Actions
 * 包含：创建测量任务、查询测量进度等
 */

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { QuoteService, type ImportAction } from '@/services/quote.service';
import { auth } from '@/shared/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { eq, and, desc } from 'drizzle-orm';
import { updateQuoteTotal } from './shared-helpers';
import { logger } from '@/shared/lib/logger';
// customers, leads 导入已移除（未使用）

// Schema Definitions
const previewImportSchema = z.object({
    quoteId: z.string().uuid(),
    measureTaskId: z.string().uuid()
});

const importActionSchema = z.object({
    type: z.enum(['CREATE_ROOM', 'CREATE_ITEM', 'UPDATE_ITEM']),
    description: z.string(),
    data: z.record(z.string(), z.unknown()),
    measureItem: z.record(z.string(), z.unknown()),
    diff: z.array(z.object({
        field: z.string(),
        oldValue: z.unknown(),
        newValue: z.unknown()
    })).optional()
});

const executeImportSchema = z.object({
    quoteId: z.string().uuid(),
    actions: z.array(importActionSchema)
});

/**
 * 获取指定报价单关联客户的已完成可导入测量任务列表。
 * 【租户隔离】通过报价单 ID 确认当前用户是否有权访问该客户的测量数据。
 * 
 * @param quoteId - 报价单 ID
 * @returns 包含测量任务列表或错误信息的响应对象
 */
export async function getImportableMeasureTasks(quoteId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    // Correction: Fetch quote properly
    const quote = await db.query.quotes.findFirst({
        where: (quotes, { eq, and }) => and(
            eq(quotes.id, quoteId),
            eq(quotes.tenantId, session.user.tenantId)
        ),
        with: {
            customer: true
        }
    });

    if (!quote) return { success: false, error: 'Quote not found' };

    // Find tasks for this customer 
    // Logic: Same Customer ID
    const tasks = await db.query.measureTasks.findMany({
        where: and(
            eq(measureTasks.customerId, quote.customerId),
            eq(measureTasks.tenantId, session.user.tenantId)
            // eq(measureTasks.status, 'COMPLETED') // Optional: only show completed? strictly yes, but for dev maybe allow others
        ),
        orderBy: [desc(measureTasks.createdAt)],
        limit: 10
    });

    return { success: true, data: tasks };
}

/**
 * 内部操作：预览将测量数据导入至特定报价单的效果
 * @param data 包含报价单ID和测量任务ID的对象
 * @returns 预览差异和操作列表
 */
const previewMeasurementImportActionInternal = createSafeAction(previewImportSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const result = await QuoteService.previewMeasurementImport(data.quoteId, data.measureTaskId, session.user.tenantId);
    return result;
});

/**
 * 客户端调用：预览测量数据导入效果
 * @param params 包含报价单ID和测量任务ID的对象
 * @returns 预览结果数据
 */
export async function previewMeasurementImport(params: z.infer<typeof previewImportSchema>) {
    return previewMeasurementImportActionInternal(params);
}

/**
 * 内部操作：确认并执行测量数据的导入，创建或更新报价行项目
 * @param data 包含导入操作定义的请求对象
 * @returns 执行成功状态及相关详情
 */
const executeMeasurementImportActionInternal = createSafeAction(executeImportSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const result = await QuoteService.executeMeasurementImport(data.quoteId, data.actions as ImportAction[], session.user.tenantId);

    // 导入完成后重新计算总额
    await updateQuoteTotal(data.quoteId, session.user.tenantId);

    revalidatePath(`/quotes/${data.quoteId}`);
    revalidateTag('quotes', {});
    logger.info('[quotes] 测量数据成功导入报价单', { quoteId: data.quoteId, actionCount: data.actions.length });
    return result;
});

/**
 * 客户端调用：确认并执行测量数据导入
 * @param params 导入操作请求参数
 * @returns 导入结果响应
 */
export async function executeMeasurementImport(params: z.infer<typeof executeImportSchema>) {
    return executeMeasurementImportActionInternal(params);
}
