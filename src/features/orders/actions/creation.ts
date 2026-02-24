'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { OrderService } from '@/services/order.service';
import { AuditService } from '@/shared/lib/audit-service';
import { createOrderSchema } from '../action-schemas';
import { checkAndGenerateCommission } from '@/features/channels/logic/commission.service';
import { logger } from '@/shared/lib/logger';

/**
 * 从报价单创建订单 Action 类型定义
 */
type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * 从报价单创建订单 Action。
 * 
 * @description 根据指定的报价单 ID 和首期付款金额，调用 OrderService 进行订单转换。
 * 包含逻辑：
 * 1. 权限与租户校验
 * 2. 报价单合法性检查
 * 3. 转换逻辑执行
 * 4. 记录创建操作的审计日志
 * 5. 触发佣金生成异步逻辑
 * 
 * @param input 包含报价单 ID (`quoteId`) 和可选的首期付款金额 (`paymentAmount`)
 * @returns 创建成功的订单对象 Promise
 * @throws {Error} 未授权、报价单不存在或转换失败时抛出
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
        const order = await OrderService.convertFromQuote(quoteId, tenantId, paymentAmount ?? '0');

        // 3. 记录审计日志
        await AuditService.record({
            tenantId,
            userId: session.user.id,
            tableName: 'orders',
            recordId: order.id,
            action: 'ORDER_CREATED',
            newValues: { quoteId, paymentAmount },
        });

        logger.info('[orders] 订单从报价单转化成功:', { orderId: order.id, tenantId, quoteId });

        // 4. 异步处理佣金逻辑 (不阻塞订单创建)
        checkAndGenerateCommission(order.id, 'ORDER_CREATED').catch((e: Error) => {
            logger.error('[createOrderFromQuote] 佣金处理失败:', e.message);
        });

        return order;
    } catch (e: unknown) {
        const error = e as Error;
        logger.error('[orders] 订单转化失败:', { quoteId, error: error.message });
        throw new Error(error.message || '订单创建失败');
    }
}
