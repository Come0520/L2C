import { db } from '@/shared/api/db';
import { orderChanges, orders, orderItems } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 变更单项（用于自动差价计算）
 */
interface ChangeItem {
    orderItemId: string;
    field: 'quantity' | 'unitPrice' | 'width' | 'height';
    oldValue: number;
    newValue: number;
}

export class ChangeOrderService {

    /**
     * 自动计算变更差价
     * 
     * @param orderId - 订单 ID
     * @param changes - 变更项列表
     * @returns 差价金额（正数为加价，负数为减价）
     */
    static async calculateDiff(
        orderId: string,
        tenantId: string,
        changes: ChangeItem[]
    ): Promise<{ diffAmount: number; details: string[] }> {
        const details: string[] = [];
        let diffAmount = 0;

        for (const change of changes) {
            // 查询订单项
            const item = await db.query.orderItems.findFirst({
                where: and(
                    eq(orderItems.id, change.orderItemId),
                    eq(orderItems.tenantId, tenantId)
                ),
                columns: {
                    productName: true,
                    quantity: true,
                    unitPrice: true,
                    subtotal: true,
                }
            });

            if (!item) continue;

            const oldSubtotal = parseFloat(item.subtotal || '0');
            let newSubtotal = oldSubtotal;

            if (change.field === 'quantity') {
                const unitPrice = parseFloat(item.unitPrice || '0');
                newSubtotal = unitPrice * change.newValue;
                details.push(`${item.productName}: 数量 ${change.oldValue} → ${change.newValue}`);
            } else if (change.field === 'unitPrice') {
                const quantity = parseFloat(item.quantity || '0');
                newSubtotal = change.newValue * quantity;
                details.push(`${item.productName}: 单价 ¥${change.oldValue} → ¥${change.newValue}`);
            }

            diffAmount += (newSubtotal - oldSubtotal);
        }

        return {
            diffAmount: Math.round(diffAmount * 100) / 100, // 保留2位小数
            details,
        };
    }

    /**
     * Create a new change request
     */
    static async createRequest(
        orderId: string,
        tenantId: string,
        data: {
            type: 'FIELD_CHANGE' | 'CUSTOMER_CHANGE' | 'STOCK_OUT' | 'OTHER';
            reason: string;
            diffAmount?: number; // Optional price difference
            originalData?: unknown;
            newData?: unknown;
            requestedBy: string;
        }
    ) {
        return await db.transaction(async (tx) => {
            // Verify order exists
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });
            if (!order) throw new Error("Order not found");

            // Create change request
            const [request] = await tx.insert(orderChanges).values({
                tenantId,
                orderId,
                type: data.type,
                status: 'PENDING',
                reason: data.reason,
                diffAmount: data.diffAmount ? String(data.diffAmount) : '0', // Decimal as string
                originalData: data.originalData,
                newData: data.newData,
                requestedBy: data.requestedBy,
            }).returning();

            return request;
        });
    }

    /**
     * Approve a change request and apply changes
     */
    static async approveRequest(requestId: string, tenantId: string, approvedBy: string) {
        return await db.transaction(async (tx) => {
            const request = await tx.query.orderChanges.findFirst({
                where: and(eq(orderChanges.id, requestId), eq(orderChanges.tenantId, tenantId))
            });

            if (!request || request.status !== 'PENDING') {
                throw new Error("Change request not found or not pending");
            }

            // 1. Mark request as APPROVED
            const [updatedRequest] = await tx.update(orderChanges)
                .set({
                    status: 'APPROVED',
                    approvedBy,
                    approvedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(orderChanges.id, requestId))
                .returning();

            // 2. Apply Changes Logic - 添加租户隔离
            if (request.type === 'FIELD_CHANGE' && request.newData) {
                await tx.update(orders)
                    .set({
                        ...(request.newData as Record<string, unknown>),
                        updatedAt: new Date()
                    })
                    .where(and(eq(orders.id, request.orderId), eq(orders.tenantId, tenantId)));
            }

            // 3. 自动更新订单金额（如有差价）- 添加租户隔离
            const diffAmount = parseFloat(request.diffAmount || '0');
            if (diffAmount !== 0) {
                const order = await tx.query.orders.findFirst({
                    where: and(eq(orders.id, request.orderId), eq(orders.tenantId, tenantId)),
                    columns: { totalAmount: true, balanceAmount: true }
                });

                if (order) {
                    const currentTotal = parseFloat(order.totalAmount || '0');
                    const currentBalance = parseFloat(order.balanceAmount || '0');

                    await tx.update(orders)
                        .set({
                            totalAmount: String(currentTotal + diffAmount),
                            balanceAmount: String(currentBalance + diffAmount),
                            updatedAt: new Date()
                        })
                        .where(and(eq(orders.id, request.orderId), eq(orders.tenantId, tenantId)));
                }
            }

            return updatedRequest;
        });
    }

    /**
     * Reject a change request
     */
    static async rejectRequest(requestId: string, tenantId: string, _rejectedBy: string, reason?: string) {
        return await db.transaction(async (tx) => {
            const request = await tx.query.orderChanges.findFirst({
                where: and(eq(orderChanges.id, requestId), eq(orderChanges.tenantId, tenantId))
            });

            if (!request) throw new Error("Change request not found");

            const currentReason = request.reason || '';
            const newReason = reason ? `${currentReason} | REFUSED: ${reason}` : currentReason;

            const [updatedRequest] = await tx.update(orderChanges)
                .set({
                    status: 'REJECTED',
                    reason: newReason,
                    updatedAt: new Date()
                })
                .where(eq(orderChanges.id, requestId))
                .returning();

            return updatedRequest;
        });
    }
}

