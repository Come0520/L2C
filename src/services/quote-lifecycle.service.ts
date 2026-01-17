import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { orders, orderItems } from '@/shared/api/schema/orders';
import { eq } from 'drizzle-orm';
import { RiskControlService } from './risk-control.service';
import { customers } from '@/shared/api/schema/customers';

export class QuoteLifecycleService {

    /**
     * Submit a quote for processing
     */
    static async submit(quoteId: string, tenantId: string, _userId: string) {
        const quote = await db.query.quotes.findFirst({
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

        const updateData = {
            status: (risk.requiresApproval ? 'PENDING_APPROVAL' : 'SUBMITTED') as any, // FIXME: use proper status type
            approvalRequired: risk.requiresApproval,
            rejectReason: null as string | null, // Clear previous rejections
        };

        // If approval needed, we might Log the reasons to a separate table or just console for now
        // Ideally we store risk.reasons in a 'risk_analysis' or 'audit_log'
        // For now, we rely on checking it again or status.

        await db.update(quotes)
            .set(updateData)
            .where(eq(quotes.id, quoteId));

        return { ...updateData, riskReasons: risk.reasons };
    }

    /**
     * Approve a quote
     */
    static async approve(quoteId: string, approverId: string) {
        // Verify approver permissions (Logic should be in Action/Auth layer, here we just execute)
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
     * Reject a quote
     */
    static async reject(quoteId: string, reason: string) {
        await db.update(quotes)
            .set({
                status: 'REJECTED',
                rejectReason: reason,
                approvalRequired: false // Reset flag? Or keep it to show why it was rejected?
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
            // Allow SUBMITTED or APPROVED.
            if (!['SUBMITTED', 'APPROVED'].includes(quote.status || '')) {
                throw new Error(`Quote status '${quote.status}' is not ready for order. Must be Submitted or Approved.`);
            }

            // Generate Order No
            const orderNo = `ORD-${new Date().getTime().toString().slice(-8)}`;

            // Fetch Customer Info for snapshot
            const customer = await tx.query.customers.findFirst({
                where: eq(customers.id, quote.customerId)
            });

            // Create Order
            const [newOrder] = await tx.insert(orders).values({
                tenantId,
                orderNo,
                quoteId: quote.rootQuoteId || quote.id,
                quoteVersionId: quote.id,
                customerId: quote.customerId,
                customerName: customer?.name,   // Snapshot
                customerPhone: customer?.phone, // Snapshot
                deliveryAddress: customer?.address, // Snapshot
                leadId: quote.leadId,
                totalAmount: quote.finalAmount,
                balanceAmount: quote.finalAmount,
                settlementType: 'pay_on_delivery',
                status: 'DRAFT',
                createdBy: userId,
                salesId: userId,
                remark: `Converted from Quote ${quote.quoteNo}`,
            } as any).returning();

            // Map Items
            const orderItemsData = quote.items.map(qItem => ({
                tenantId,
                orderId: newOrder.id,
                quoteItemId: qItem.id,
                productId: qItem.productId!,
                productName: qItem.productName,
                roomName: qItem.roomName || 'Default Room',
                category: qItem.category as any, // Cast to enum
                quantity: qItem.quantity.toString(),
                width: qItem.width?.toString(),
                height: qItem.height?.toString(),
                unitPrice: qItem.unitPrice.toString(),
                subtotal: qItem.subtotal.toString(),
                status: 'PENDING',
                sortOrder: qItem.sortOrder,
            }));

            if (orderItemsData.length > 0) {
                await tx.insert(orderItems).values(orderItemsData as any);
            }

            // Update Quote Status
            await tx.update(quotes)
                .set({ status: 'ORDERED', lockedAt: new Date() })
                .where(eq(quotes.id, quoteId));

            return newOrder;
        });
    }
}
