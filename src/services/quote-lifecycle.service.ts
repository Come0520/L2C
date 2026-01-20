import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { orders, orderItems } from '@/shared/api/schema/orders';
import { eq, desc, and, lt } from 'drizzle-orm';
import { RiskControlService } from './risk-control.service';
import { customers } from '@/shared/api/schema/customers';
import { customerAddresses } from '@/shared/api/schema/customer-addresses';
import { submitApproval } from '@/features/approval/actions/submission';

export class QuoteLifecycleService {

    /**
     * Submit a quote for processing
     */
    static async submit(quoteId: string, tenantId: string, _userId: string) {
        return await db.transaction(async (tx) => {
            const quote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId),
            });
            if (!quote) throw new Error('Quote not found');
            if (quote.status !== 'DRAFT' && quote.status !== 'REJECTED') {
                throw new Error('Only draft or rejected quotes can be submitted');
            }

            // Risk Check
            const risk = await RiskControlService.checkQuoteRisk(quoteId, tenantId);

            if (risk.blockSubmission) {
                throw new Error(`Submission Blocked: ${risk.reasons.join(', ')}`);
            }

            if (risk.requiresApproval) {
                // Submit for Approval
                const approvalResult = await submitApproval({
                    entityType: 'QUOTE',
                    entityId: quoteId,
                    flowCode: 'QUOTE_DISCOUNT_APPROVAL',
                    comment: `折扣风险审批触发: ${risk.reasons.join('; ')}`,
                    amount: quote.finalAmount ? Number(quote.finalAmount) : 0,
                }, tx);

                if (!approvalResult.success) {
                    throw new Error(`Failed to submit approval: ${'error' in approvalResult ? approvalResult.error : 'Unknown error'}`);
                }

                return { success: true, status: 'PENDING_APPROVAL', riskReasons: risk.reasons };
            } else {
                // No risk -> Direct SUBMITTED
                await tx.update(quotes)
                    .set({
                        status: 'SUBMITTED',
                        approvalRequired: false,
                        rejectReason: null,
                    })
                    .where(eq(quotes.id, quoteId));

                return { success: true, status: 'SUBMITTED', riskReasons: [] };
            }
        });
    }

    /**
     * Approve a quote
     */
    static async approve(quoteId: string, approverId: string) {
        // Verify approver permissions
        await db.update(quotes)
            .set({
                status: 'APPROVED',
                approverId: approverId,
                approvedAt: new Date(),
                rejectReason: null
            })
            .where(eq(quotes.id, quoteId));
    }

    /**
     * Customer accepts the quote
     */
    static async accept(quoteId: string) {
        await db.update(quotes)
            .set({
                status: 'ACCEPTED',
                updatedAt: new Date()
            })
            .where(eq(quotes.id, quoteId));
    }

    /**
     * Reject a quote
     */
    static async reject(quoteId: string, reason: string) {
        await db.update(quotes)
            .set({
                status: 'REJECTED',
                rejectReason: reason,
                approvalRequired: false
            })
            .where(eq(quotes.id, quoteId));
    }

    /**
     * Lock a quote (Before Order)
     */
    static async lock(quoteId: string) {
        await db.update(quotes)
            .set({
                lockedAt: new Date(),
                status: 'LOCKED'
            })
            .where(eq(quotes.id, quoteId));
    }

    /**
     * Convert Quote to Order
     */
    static async convertToOrder(quoteId: string, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const quote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId),
                with: { items: true }
            });

            if (!quote) throw new Error('Quote not found');
            if (!['SUBMITTED', 'APPROVED'].includes(quote.status || '')) {
                throw new Error(`Quote status '${quote.status}' is not ready for order. Must be Submitted or Approved.`);
            }

            const orderNo = `ORD-${new Date().getTime().toString().slice(-8)}`;

            const customer = await tx.query.customers.findFirst({
                where: eq(customers.id, quote.customerId)
            });

            const addressParams = await tx.query.customerAddresses.findFirst({
                where: eq(customerAddresses.customerId, quote.customerId),
                orderBy: [desc(customerAddresses.isDefault), desc(customerAddresses.createdAt)]
            });
            const deliveryAddress = addressParams
                ? `${addressParams.community ? addressParams.community + ' ' : ''}${addressParams.address}`
                : '';

            const [newOrder] = await tx.insert(orders).values({
                tenantId,
                orderNo,
                quoteId: quote.rootQuoteId || quote.id,
                quoteVersionId: quote.id,
                customerId: quote.customerId,
                customerName: customer?.name,
                customerPhone: customer?.phone,
                deliveryAddress: deliveryAddress,
                leadId: quote.leadId,
                totalAmount: quote.finalAmount,
                balanceAmount: quote.finalAmount,
                settlementType: 'pay_on_delivery',
                status: 'DRAFT',
                createdBy: userId,
                salesId: userId,
                remark: `Converted from Quote ${quote.quoteNo}`,
            } as any).returning();

            const orderItemsData = quote.items.map(qItem => ({
                tenantId,
                orderId: newOrder.id,
                quoteItemId: qItem.id,
                productId: qItem.productId!,
                productName: qItem.productName,
                roomName: qItem.roomName || 'Default Room',
                category: qItem.category as any,
                quantity: qItem.quantity.toString(),
                width: qItem.width?.toString(),
                height: qItem.height?.toString(),
                unitPrice: qItem.unitPrice.toString(),
                subtotal: qItem.subtotal.toString(),
                status: 'PENDING',
                sortOrder: qItem.sortOrder,
                attributes: qItem.attributes,
                calculationParams: qItem.calculationParams,
            }));

            if (orderItemsData.length > 0) {
                await tx.insert(orderItems).values(orderItemsData as any);
            }

            await tx.update(quotes)
                .set({ status: 'ORDERED', lockedAt: new Date() })
                .where(eq(quotes.id, quoteId));

            return newOrder;
        });
    }

    /**
     * 过期处理自动化 (Check for Expirations)
     * 自动将超过 validUntil 的报价单标记为 EXPIRED
     */
    static async checkExpirations() {
        const now = new Date();
        const result = await db.update(quotes)
            .set({ status: 'EXPIRED' })
            .where(and(
                eq(quotes.status, 'SUBMITTED'), // 已提交给客户的才需要过期
                lt(quotes.validUntil, now)
            ))
            .returning({ id: quotes.id });

        return result.length;
    }
}
