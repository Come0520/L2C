
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { OrderService } from '@/services/order.service';
import { AuditService } from '@/shared/lib/audit-service';
import { createOrderSchema } from '../action-schemas';
import { checkAndGenerateCommission } from '@/features/channels/logic/commission.service';

/**
 * 从报价单创建订单 Action 类型定义
 */
type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * 从报价单创建订单
 */
export async function createOrderFromQuote(input: CreateOrderInput) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    const tenantId = session.user.tenantId;

    const rawInput = input && typeof input === 'object' ? input : {} as CreateOrderInput;
    const validatedInput = createOrderSchema.parse(rawInput);
    const { quoteId, paymentAmount } = validatedInput;

    try {
        // 1. 获取报价单
        const quote = await db.query.quotes.findFirst({
            where: (q, { eq, and }) => and(eq(q.id, quoteId), eq(q.tenantId, tenantId)),
        });

        if (!quote) throw new Error('Quote not found');

        // 2. 调用 Service 层转换
        const order = await OrderService.convertFromQuote(quoteId, tenantId, paymentAmount);

        // 3. 记录审计日志
        await AuditService.record({
            tenantId,
            userId: session.user.id,
            tableName: 'orders',
            recordId: order.id,
            action: 'ORDER_CREATED',
            newValues: { quoteId, paymentAmount },
        });

        // 4. 异步处理佣金逻辑 (不阻塞订单创建)
        checkAndGenerateCommission(order.id, tenantId).catch((e: Error) => {
            console.error('[createOrderFromQuote] 佣金处理失败:', e.message);
        });

        return order;
    } catch (e: unknown) {
        const error = e as Error;
        throw new Error(error.message || '订单创建失败');
    }
}
