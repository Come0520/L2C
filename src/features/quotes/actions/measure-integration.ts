'use server';
import { logger } from '@/shared/lib/logger';
import { revalidateTag } from 'next/cache';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, and } from 'drizzle-orm';

// syncMeasureToQuote removed in favor of measurement-actions.ts

const createMeasureFromQuoteSchema = z.object({
    quoteId: z.string().uuid(),
    customerId: z.string().uuid(),
    leadId: z.string().uuid(), // Required per schema
});

/**
 * 内部服务器操作：从报价单创建关联的测量任务。
 * 流程：验证报价单归属 -> 生成测量单号 -> 插入测量任务记录 -> 失效缓存。
 * 【租户隔离】强制校验当前用户的租户归属。
 * 
 * @param data - 包含报价单 ID、客户 ID 和线索 ID 的对象
 * @param context - 执行上下文，由 createSafeAction 注入，包含会话信息
 * @returns 包含创建的测量任务 ID 的成功响应
 * @throws 当无权访问或报价单不存在时抛出错误
 */
const createMeasureFromQuoteActionInternal = createSafeAction(createMeasureFromQuoteSchema, async (data, context) => {
    const tenantId = context.session.user.tenantId;
    if (!tenantId) throw new Error('Unauthorized');

    // 🔒 验证报价单归属
    const existingQuote = await db.query.quotes.findFirst({
        where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, tenantId)),
        columns: { id: true }
    });
    if (!existingQuote) throw new Error('报价单不存在或无权操作');

    const measureNo = `MS${Date.now()}`;
    const [measureTask] = await db.insert(measureTasks).values({
        measureNo,
        tenantId: tenantId,
        customerId: data.customerId,
        leadId: data.leadId,
        status: 'PENDING',
        type: 'QUOTE_BASED', // Valid enum value
        scheduledAt: new Date(),
        remark: `Created from quote ${data.quoteId}`
    }).returning();

    revalidatePath('/measurements');
    revalidatePath(`/quotes/${data.quoteId}`);
    revalidateTag('quotes', {});

    logger.info('[quotes] 从报价单成功触发测量任务创建', { quoteId: data.quoteId, measureTaskId: measureTask.id });

    return {
        success: true,
        measureTaskId: measureTask.id
    };
});

/**
 * 客户端可调用的包装方法：从报价单创建关联的测量任务
 * @param params 包含所需参数的对象
 * @returns 包装了响应的创建结果
 */
export async function createMeasureFromQuote(params: z.infer<typeof createMeasureFromQuoteSchema>) {
    return createMeasureFromQuoteActionInternal(params);
}
