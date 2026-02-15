import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { orders, orderItems } from '@/shared/api/schema/orders';
import { eq, desc, and, lt } from 'drizzle-orm';
import { RiskControlService } from '@/services/risk-control.service';
import { customers } from '@/shared/api/schema/customers';
import { customerAddresses } from '@/shared/api/schema/customer-addresses';
import { submitApproval } from '@/features/approval/actions/submission';
import type { InferInsertModel } from 'drizzle-orm';

export class QuoteLifecycleService {
  /**
   * Submit a quote for processing
   */
  /**
   * Submit a quote for processing
   */
  static async submit(quoteId: string, tenantId: string, _userId: string) {
    return await db.transaction(async (tx) => {
      // 🔒 安全修复：强制校验租户归属
      const quote = await tx.query.quotes.findFirst({
        where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
        with: { items: true },
      });

      if (!quote) throw new Error('报价单不存在或无权操作');

      if (quote.status !== 'DRAFT' && quote.status !== 'REJECTED') {
        throw new Error('Only draft or rejected quotes can be submitted');
      }

      // 校验：至少1条商品且金额大于0
      const itemCount = quote.items?.length || 0;
      const finalAmount = Number(quote.finalAmount || 0);

      if (itemCount === 0) {
        throw new Error('报价单至少需要包含1条商品才能提交');
      }

      if (finalAmount <= 0) {
        throw new Error('报价单金额必须大于0才能提交');
      }

      // Risk Check
      const risk = await RiskControlService.checkQuoteRisk(quoteId, tenantId);

      if (risk.blockSubmission) {
        throw new Error(`Submission Blocked: ${risk.reasons.join(', ')}`);
      }

      if (risk.requiresApproval) {
        // Submit for Approval
        const approvalResult = await submitApproval(
          {
            entityType: 'QUOTE',
            entityId: quoteId,
            flowCode: 'QUOTE_DISCOUNT_APPROVAL',
            comment: `折扣风险审批触发: ${risk.reasons.join('; ')}`,
            amount: quote.finalAmount ? Number(quote.finalAmount) : 0,
          },
          tx
        );

        if (!approvalResult.success) {
          throw new Error(
            `Failed to submit approval: ${'error' in approvalResult ? approvalResult.error : 'Unknown error'}`
          );
        }

        return { success: true, status: 'PENDING_APPROVAL', riskReasons: risk.reasons };
      } else {
        // 没有风险 -> 直接转为待客户确认状态 (PENDING_CUSTOMER)
        await tx
          .update(quotes)
          .set({
            status: 'PENDING_CUSTOMER',
            approvalRequired: false,
            rejectReason: null,
          })
          .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

        return { success: true, status: 'PENDING_CUSTOMER', riskReasons: [] };
      }
    });
  }

  // ... (approve/accept/reject/lock checks were already safer with optional tenantId, but ensuring convertToOrder is safe constitutes the main P0fix here)

  static async approve(quoteId: string, approverId: string, tenantId: string) {
    // 🔒 安全修复：校验报价单归属当前租户
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
      columns: { id: true },
    });
    if (!quote) throw new Error('报价单不存在或无权操作');

    return await db
      .update(quotes)
      .set({
        status: 'APPROVED',
        approvedAt: new Date(),
        approverId: approverId,
        approvalRequired: false,
        rejectReason: null,
      })
      .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));
  }

  static async reject(quoteId: string, reason: string, tenantId: string) {
    // 🔒 安全修复：校验报价单归属当前租户
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
      columns: { id: true },
    });
    if (!quote) throw new Error('报价单不存在或无权操作');

    return await db
      .update(quotes)
      .set({
        status: 'REJECTED',
        rejectReason: reason,
        approvalRequired: false,
      })
      .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));
  }

  /**
   * Convert Quote to Order
   */
  static async convertToOrder(quoteId: string, tenantId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // 🔒 安全修复：强制校验租户归属
      const quote = await tx.query.quotes.findFirst({
        where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
        with: { items: true },
      });

      if (!quote) throw new Error('Quote not found or permission denied');

      if (!['PENDING_CUSTOMER', 'APPROVED'].includes(quote.status || '')) {
        throw new Error(
          `报价单状态为 '${quote.status}'，无法转订单。必须是“待客户确认”或“已批准”状态。`
        );
      }

      const orderNo = `ORD-${new Date().getTime().toString().slice(-8)}`;

      // Customer check also scoped to tenant ideally, or just rely on ID since we trust quote.customerId
      const customer = await tx.query.customers.findFirst({
        where: eq(customers.id, quote.customerId),
      });

      const addressParams = await tx.query.customerAddresses.findFirst({
        where: eq(customerAddresses.customerId, quote.customerId),
        orderBy: [desc(customerAddresses.isDefault), desc(customerAddresses.createdAt)],
      });
      const deliveryAddress = addressParams
        ? `${addressParams.community ? addressParams.community + ' ' : ''}${addressParams.address}`
        : '';

      const [newOrder] = await tx
        .insert(orders)
        .values({
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
          settlementType: 'CASH', // 修正为有效的枚举值
          status: 'DRAFT',
          createdBy: userId,
          salesId: userId,
          remark: `Converted from Quote ${quote.quoteNo}`,
        })
        .returning();

      // 转换 quoteItems 到 orderItems （确保类型安全）
      type NewOrderItem = InferInsertModel<typeof orderItems>;
      const orderItemsData: NewOrderItem[] = quote.items.map((qItem) => ({
        tenantId,
        orderId: newOrder.id,
        quoteItemId: qItem.id,
        productId: qItem.productId!,
        productName: qItem.productName,
        roomName: qItem.roomName || 'Default Room',
        // 类型安全：报价单 category 是 varchar，订单 category 是 enum
        // 假设验证在插入前已完成，或根据业务需求通过默认值回退
        category: ([
          'CURTAIN',
          'WALLPAPER',
          'WALLCLOTH',
          'MATTRESS',
          'OTHER',
          'CURTAIN_FABRIC',
          'CURTAIN_SHEER',
          'CURTAIN_TRACK',
          'MOTOR',
          'CURTAIN_ACCESSORY',
          'WALLCLOTH_ACCESSORY',
          'WALLPANEL',
          'WINDOWPAD',
          'STANDARD',
          'SERVICE',
        ].includes(qItem.category)
          ? qItem.category
          : 'OTHER') as NewOrderItem['category'],
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
        await tx.insert(orderItems).values(orderItemsData);
      }

      await tx
        .update(quotes)
        .set({ status: 'ORDERED', lockedAt: new Date() })
        .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

      return newOrder;
    });
  }

  /**
   * 过期处理自动化 (Check for Expirations)
   * 自动将超过 validUntil 的报价单标记为 EXPIRED
   */
  static async checkExpirations() {
    const now = new Date();
    const result = await db
      .update(quotes)
      .set({ status: 'EXPIRED' })
      .where(
        and(
          eq(quotes.status, 'PENDING_CUSTOMER'), // 已发送给客户的才需要过期
          lt(quotes.validUntil, now)
        )
      )
      .returning({ id: quotes.id });

    return result.length;
  }
}
