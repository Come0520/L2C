import { db } from "@/shared/api/db";
import { orders, orderItems } from "@/shared/api/schema";
import { quotes } from "@/shared/api/schema/quotes";
import { OrderStateMachine } from '@/features/orders/logic/order-state-machine';
import type { OrderStatus } from '@/shared/lib/status-maps';
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";
import { randomBytes } from "crypto";
import { POSplitService } from "./po-split.service";
import { submitApproval } from "@/features/approval/actions/submission";
import Decimal from "decimal.js";
import { AuditService } from "@/shared/lib/audit-service";

export interface CreateOrderOptions {
    paymentProofImg?: string;
    confirmationImg?: string;
    paymentAmount?: string;
    paymentMethod?: 'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK';
    remark?: string;
}

export class OrderService {

    private static async generateOrderNo() {
        const prefix = `ORD${format(new Date(), 'yyyyMMdd')}`;
        const random = randomBytes(3).toString('hex').toUpperCase();
        return `${prefix}${random}`;
    }

    /**
     * Convert a WON Quote to a Draft Order.
     * Strict validation: Quote must be in WON status (or acceptable status).
     */
    static async convertFromQuote(quoteId: string, tenantId: string, userId: string, options?: CreateOrderOptions) {
        return await db.transaction(async (tx) => {
            // 1. Fetch Quote & Items & Customer
            const quote = await tx.query.quotes.findFirst({
                where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
                with: {
                    items: {
                        with: {
                            product: true
                        }
                    },

                    customer: true,
                    lead: true // Fetch Lead info
                }
            });

            if (!quote) throw new Error("Quote not found");

            // 规则 1: 待客户确认状态禁止转化
            if (quote.status === 'PENDING_CUSTOMER') {
                throw new Error('无法转订单：待客户确认的报价单不能直接转订单，请等待客户确认后再操作。');
            }

            // 规则 2: 只有已批准/已接受状态可以转化
            const allowedStatuses = ['APPROVED', 'ACCEPTED'];
            if (!allowedStatuses.includes(quote.status || '')) {
                throw new Error(`无法转订单：报价单状态为 ${quote.status}。只有“已批准”、“已接受”或“待客户确认”状态的报价单可以转订单。`);
            }

            // Check availability
            const existingOrder = await tx.query.orders.findFirst({
                where: eq(orders.quoteId, quoteId)
            });
            if (existingOrder) {
                throw new Error(`Order already exists for this quote: ${existingOrder.orderNo}`);
            }

            // 2. Create Order Header
            const orderNo = await this.generateOrderNo();

            const total = new Decimal(quote.totalAmount || 0);
            const paid = new Decimal(options?.paymentAmount || 0);
            const balance = total.minus(paid);

            // Prepare Snapshot
            const quoteSnapshot = {
                quote: {
                    ...quote,
                    // Ensure items have product details
                    items: quote.items
                },
                customer: quote.customer,
                generatedAt: new Date().toISOString()
            };

            const [newOrder] = await tx.insert(orders).values({
                tenantId,
                orderNo,
                quoteId: quote.id,
                quoteVersionId: quote.id,
                customerId: quote.customerId,
                customerName: quote.customer.name, // Use relation
                customerPhone: quote.customer.phone, // Use relation
                deliveryAddress: options?.paymentProofImg ? undefined : undefined, // Simplify

                // Populate Channel Info from Lead
                channelId: quote.lead?.channelId,
                channelContactId: quote.lead?.channelContactId,
                // channelCooperationMode: We might need to fetch channel to get this default, or leave null to use channel default at runtime

                totalAmount: quote.totalAmount,
                paidAmount: options?.paymentAmount || '0',
                balanceAmount: String(balance),
                settlementType: 'PREPAID',
                status: 'PENDING_PO',

                confirmationImg: options?.confirmationImg,
                paymentProofImg: options?.paymentProofImg,
                paymentMethod: options?.paymentMethod,
                paymentTime: options?.paymentAmount ? new Date() : null,
                remark: options?.remark,

                quoteSnapshot, // Save Deep Snapshot
                snapshotData: {}, // Initialize generic snapshot data

                isLocked: false, // Default false

                salesId: quote.createdBy,
                createdBy: userId,
            }).returning();

            // 3. Create Order Items
            if (quote.items && quote.items.length > 0) {
                const itemsToInsert = quote.items.map(item => ({
                    tenantId,
                    orderId: newOrder.id,
                    quoteItemId: item.id,
                    productId: item.productId!,
                    productName: item.productName,
                    category: item.category as typeof orderItems.$inferSelect.category,
                    quantity: item.quantity,
                    width: item.width,
                    height: item.height,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    roomName: item.roomName || 'Default',
                    remark: item.remark,
                    status: 'PENDING' as const,
                }));
                await tx.insert(orderItems).values(itemsToInsert);
            }

            return newOrder;
        });
    }

    /**
     * 锁定订单
     * 阻止对订单明细的进一步编辑。
     */
    static async lockOrder(orderId: string, tenantId: string, version: number, _userId: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error("Order not found");
            if (order.isLocked) throw new Error("Order is already locked");

            const [updatedOrder] = await tx.update(orders)
                .set({
                    isLocked: true,
                    lockedAt: new Date(),
                    version: order.version + 1,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning();

            if (!updatedOrder) throw new Error("订单已被其他用户修改，请刷新后重试");

            return updatedOrder;
        });
    }

    /**
     * 更新订单状态
     * 订单确认时触发采购拆单。
     */
    static async updateOrderStatus(orderId: string, newStatus: string, tenantId: string, version: number, userId: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error("订单不存在");

            // 状态机验证
            if (order.status) {
                const isValid = OrderStateMachine.validateTransition(order.status as OrderStatus, newStatus as OrderStatus);
                if (!isValid) {
                    throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
                }
            }

            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: newStatus as typeof orders.$inferSelect.status,
                    version: order.version + 1,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning();

            if (!updatedOrder) throw new Error("订单已被其他用户修改，请刷新后重试");

            // 审计日志
            await AuditService.record({
                tenantId,
                userId,
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { status: order.status },
                newValues: { status: newStatus },
                changedFields: { status: newStatus }
            }, tx);

            // PENDING_PO logic (replaced CONFIRMED which seems invalid)
            if (newStatus === 'PENDING_PO') {
                await POSplitService.splitOrderToPOs(orderId, tenantId, userId);
            }

            return updatedOrder;
        });
    }

    /**
     * 申请撤单
     * 仅 PENDING_PRODUCTION 或 IN_PRODUCTION 状态的订单可发起撤单申请。
     */
    static async requestCancellation(orderId: string, tenantId: string, version: number, userId: string, reason: string) {

        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error("订单不存在");
            if (order.status !== 'PENDING_PRODUCTION' && order.status !== 'IN_PRODUCTION') {
                throw new Error("只有待生产或生产中的订单可以申请撤单");
            }

            // 触发撤单审批流程
            const result = await submitApproval({
                entityType: 'ORDER',
                entityId: orderId,
                flowCode: 'ORDER_CANCELLATION_APPROVAL',
                comment: `申请撤单原因: ${reason}`,
            }, tx);

            if (!result.success) {
                const errorMsg = (result as { error?: string }).error || '未知错误';
                throw new Error(`无法发起撤单审批: ${errorMsg}`);
            }

            // 锁定订单防止操作
            const [updatedOrder] = await tx.update(orders)
                .set({
                    isLocked: true,
                    version: order.version + 1,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning({ id: orders.id });

            if (!updatedOrder) throw new Error("订单已被其他用户修改，请刷新后重试");

            // 审计日志
            await AuditService.record({
                tenantId,
                userId,
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { isLocked: false },
                newValues: { isLocked: true, cancellationReason: reason },
                changedFields: { isLocked: true }
            }, tx);

            return { success: true, approvalId: (result as { approvalId?: string }).approvalId };
        });
    }

    /**
     * 叫停订单（原 Pause）
     * 仅流转中的订单可被叫停。
     */
    static async haltOrder(orderId: string, tenantId: string, version: number, userId: string, reason: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error("订单不存在");

            // 允许叫停的状态列表（与状态机 transitions 保持一致）
            const allowedStatuses = [
                'SIGNED', 'PAID', 'PENDING_PO',
                'PENDING_PRODUCTION', 'IN_PRODUCTION',
                'PENDING_DELIVERY', 'PENDING_INSTALL'
            ];

            if (!order.status || !allowedStatuses.includes(order.status)) {
                throw new Error(`当前状态 (${order.status}) 不允许叫停。允许的状态: ${allowedStatuses.join(', ')}`);
            }

            const previousStatus = order.status;

            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: 'HALTED',
                    pausedAt: new Date(),
                    pauseReason: reason,
                    snapshotData: {
                        ...(order.snapshotData as Record<string, unknown> || {}),
                        previousStatus
                    },
                    version: order.version + 1,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning();

            if (!updatedOrder) throw new Error("订单已被其他用户修改，请刷新后重试");

            // 审计日志
            await AuditService.record({
                tenantId,
                userId,
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { status: previousStatus },
                newValues: { status: 'HALTED', pauseReason: reason },
                changedFields: { status: 'HALTED', pauseReason: reason }
            }, tx); // 传入事务上下文

            return updatedOrder;
        });
    }

    /**
     * 已废弃 — 请使用 haltOrder
     */
    static async pauseOrder(_orderId: string, _tenantId: string, _reason: string) {
        throw new Error("已废弃。请使用 haltOrder 方法并传入 userId。");
    }

    /**
     * Resume Order
     * Restore original status and update cumulative pause days.
     */
    static async resumeOrder(orderId: string, tenantId: string, version: number, userId: string, remark?: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order || (order.status !== 'PAUSED' && order.status !== 'HALTED')) {
                throw new Error("Order is not PAUSED or HALTED");
            }

            let previousStatus = (order.snapshotData as { previousStatus?: string } | null)?.previousStatus;

            // Backward compatibility: Try parsing pauseReason if snapshotData missing
            if (!previousStatus && order.pauseReason) {
                try {
                    const parsed = JSON.parse(order.pauseReason);
                    if (parsed.previousStatus) {
                        previousStatus = parsed.previousStatus;
                    }
                } catch (_e) {
                    // Ignore JSON parse error, it might be a plain string reason
                }
            }

            // Fallback default
            if (!previousStatus) {
                previousStatus = 'IN_PRODUCTION';
            }

            const pauseStart = order.pausedAt;
            let addedDays = 0;
            if (pauseStart) {
                const diffTime = Math.abs(new Date().getTime() - pauseStart.getTime());
                addedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: previousStatus as typeof orders.$inferSelect.status,
                    pausedAt: null,
                    pauseReason: null,
                    pauseCumulativeDays: (order.pauseCumulativeDays || 0) + addedDays,
                    version: order.version + 1,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning();

            if (!updatedOrder) throw new Error("订单已被其他用户修改，请刷新后重试");

            // Audit Log
            await AuditService.record({
                tenantId,
                userId,
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { status: order.status },
                newValues: { status: previousStatus, pauseReason: null, remark },
                changedFields: { status: previousStatus, pauseReason: null, remark }
            }, tx);

            return updatedOrder;
        });
    }

    /**
     * Confirm Installation Completed
     * Moves order to INSTALLATION_COMPLETED (or PENDING_CONFIRMATION if configured)
     */
    static async confirmInstallation(orderId: string, tenantId: string, version: number, updatedBy: string) {
        return await db.transaction(async (tx) => {
            // 先查询订单当前状态，进行状态验证
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error('订单不存在');
            if (order.status !== 'PENDING_INSTALL') {
                throw new Error(`当前状态 ${order.status} 不允许确认安装`);
            }

            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: 'INSTALLATION_COMPLETED',
                    version: order.version + 1,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning();

            if (!updatedOrder) throw new Error("订单已被其他用户修改，请刷新后重试");

            // 审计日志
            await AuditService.record({
                tenantId,
                userId: updatedBy,
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { status: order.status },
                newValues: { status: 'INSTALLATION_COMPLETED' },
                changedFields: { status: 'INSTALLATION_COMPLETED' }
            }, tx);

            return updatedOrder;
        });
    }

    static async requestCustomerConfirmation(orderId: string, tenantId: string, version: number, userId: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });
            if (!order) throw new Error('订单不存在');

            const [result] = await tx.update(orders)
                .set({
                    status: 'PENDING_CONFIRMATION',
                    version: order.version + 1,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning();

            if (!result) throw new Error("订单已被其他用户修改，请刷新后重试");

            // 审计日志
            await AuditService.record({
                tenantId,
                userId,
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { status: order.status },
                newValues: { status: 'PENDING_CONFIRMATION' },
                changedFields: { status: 'PENDING_CONFIRMATION' }
            }, tx);

            return result;
        });
    }

    static async customerAccept(orderId: string, tenantId: string, version: number) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });
            if (!order) throw new Error('订单不存在');

            const [result] = await tx.update(orders)
                .set({
                    status: 'COMPLETED',
                    version: order.version + 1,
                    completedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning();

            if (!result) throw new Error("订单已被其他用户修改，请刷新后重试");

            await AuditService.record({
                tenantId,
                userId: 'system',
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { status: order.status },
                newValues: { status: 'COMPLETED' },
                changedFields: { status: 'COMPLETED' }
            }, tx);

            return result;
        });
    }

    static async customerReject(orderId: string, tenantId: string, version: number, reason: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });
            if (!order) throw new Error('订单不存在');

            const [result] = await tx.update(orders)
                .set({
                    status: 'INSTALLATION_REJECTED',
                    remark: reason,
                    version: order.version + 1,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId),
                    eq(orders.version, version)
                ))
                .returning();

            if (!result) throw new Error("订单已被其他用户修改，请刷新后重试");

            await AuditService.record({
                tenantId,
                userId: 'system',
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { status: order.status },
                newValues: { status: 'INSTALLATION_REJECTED', remark: reason },
                changedFields: { status: 'INSTALLATION_REJECTED', remark: reason }
            }, tx);

            return result;
        });
    }
}
