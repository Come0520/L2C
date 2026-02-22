import { db } from '@/shared/api/db';
import { orders, orderItems, quotes, paymentSchedules } from '@/shared/api/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
import { generateOrderNo } from '@/shared/lib/generators';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';
import { productCategoryEnum } from '@/shared/api/schema/enums';

/** 合法的订单状态值 */
export const VALID_STATUSES = [
    'DRAFT', 'PENDING_PO', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED',
    'PENDING_DELIVERY', 'PENDING_INSTALL', 'HALTED',
] as const;

export interface GetOrdersParams {
    status?: string | null;
    page: number;
    limit: number;
    cursor?: string;
}

/**
 * 订单领域服务 (Miniprogram)
 * 负责处理小程序端订单核心业务流程，包括列表查询与从报价单转换创建订单的复杂事务
 */
export class OrderService {
    /**
     * 获取订单列表（含客户名称）
     *
     * @param tenantId - 租户 ID
     * @param params - 状态与分页参数
     * @returns 订单列表数据
     */
    static async getOrders(tenantId: string, params: GetOrdersParams) {
        const { status, page, limit, cursor } = params;

        const conditions = [eq(orders.tenantId, tenantId)];

        if (status && status !== 'ALL' && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
            // 避免使用 as any，直接断言为支持的联合类型或交由 Drizzle 推导
            conditions.push(eq(orders.status, status as typeof VALID_STATUSES[number]));
        }

        if (cursor) {
            // 利用基于时间戳记录的 Cursor 直接利用索引进行截断过滤，避免传统的 limit/offset O(N) 全表扫丢弃
            conditions.push(lt(orders.createdAt, new Date(cursor)));
        }

        const list = await db.query.orders.findMany({
            where: and(...conditions),
            orderBy: [desc(orders.createdAt)],
            limit,
            // 若带有 cursor 则不再施加 offset 偏移计算
            offset: cursor ? 0 : (page - 1) * limit,
            with: {
                customer: {
                    columns: { name: true }
                }
            }
        });

        return list;
    }

    /**
     * 从已确认报价单创建订单
     * 包含事务：创建订单 → 创建订单项 → 创建首付款计划 → 更新报价单状态
     *
     * @param tenantId - 租户 ID
     * @param userId - 操作人 ID
     * @param quoteId - 报价单 ID
     * @returns 创建完成的订单对象
     */
    static async createOrderFromQuote(tenantId: string, userId: string, quoteId: string) {
        // 1. 查询报价单（含租户隔离）
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
            with: {
                items: true
            }
        });

        if (!quote) {
            throw new Error('QUOTE_NOT_FOUND');
        }

        // 业务校验：报价单必须为已确认状态
        if (quote.status !== 'ORDERED') {
            throw new Error('QUOTE_NOT_CONFIRMED');
        }

        // 2. 创建订单
        const orderNo = await generateOrderNo(tenantId);

        const result = await db.transaction(async (tx) => {
            // A. 插入订单
            const [newOrder] = await tx.insert(orders).values({
                tenantId,
                orderNo: orderNo,
                quoteId: quote.id,
                quoteVersionId: quote.id,
                customerId: quote.customerId,
                totalAmount: quote.totalAmount,
                paidAmount: "0",
                balanceAmount: quote.totalAmount,
                settlementType: 'CASH',
                status: 'PENDING_PO',
                salesId: userId,
                remark: quote.notes,
                createdBy: userId
            }).returning();

            // B. 插入订单项
            if (quote.items && quote.items.length > 0) {
                const itemsToInsert = quote.items.map(item => ({
                    tenantId,
                    orderId: newOrder.id,
                    quoteItemId: item.id,
                    roomName: item.roomName || '未知房间',
                    productId: item.productId,
                    productName: item.productName,
                    category: item.category as typeof productCategoryEnum.enumValues[number],
                    quantity: item.quantity,
                    width: item.width,
                    height: item.height,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    status: 'PENDING' as const
                }));
                await tx.insert(orderItems).values(itemsToInsert);
            }

            // C. 创建默认付款计划（定金 60%，尾款 40%）
            const total = parseFloat(quote.totalAmount as string);
            const deposit = (total * 0.6).toFixed(2);
            const balance = (total - parseFloat(deposit)).toFixed(2);

            await tx.insert(paymentSchedules).values([
                {
                    tenantId,
                    orderId: newOrder.id,
                    name: '预付款 (60%)',
                    amount: deposit,
                    status: 'PENDING',
                    expectedDate: new Date().toISOString()
                },
                {
                    tenantId,
                    orderId: newOrder.id,
                    name: '尾款 (40%)',
                    amount: balance,
                    status: 'PENDING',
                }
            ]);

            // D. 更新报价单状态
            await tx.update(quotes)
                .set({ status: 'ORDERED' })
                .where(eq(quotes.id, quote.id));

            return newOrder;
        });

        // 3. 审计日志 (容灾设计)
        try {
            await AuditService.log(db, {
                tableName: 'orders',
                recordId: result.id,
                action: 'CREATE_FROM_QUOTE',
                userId: userId,
                tenantId: tenantId,
                details: { quoteId, orderNo: result.orderNo }
            });
        } catch (auditError) {
            logger.warn('[OrderService] 审计日志记录失败', { error: auditError, orderId: result.id });
        }

        return result;
    }
}
