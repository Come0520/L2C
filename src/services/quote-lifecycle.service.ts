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
        const result = await tx
          .update(quotes)
          .set({
            status: 'PENDING_CUSTOMER',
            approvalRequired: false,
            rejectReason: null,
          })
          .where(
            and(
              eq(quotes.id, quoteId),
              eq(quotes.tenantId, tenantId),
              // 🔒 安全修复：乐观锁，防止并发状态变更
              eq(quotes.status, quote.status!)
            )
          );

        if (result.count === 0) {
          throw new Error('操作失败：报价单状态已变更，请刷新后重试');
        }

        return { success: true, status: 'PENDING_CUSTOMER', riskReasons: [] };
      }
    });
  }

  // ... (approve/accept/reject/lock checks were already safer with optional tenantId, but ensuring convertToOrder is safe constitutes the main P0fix here)

  static async approve(quoteId: string, approverId: string, tenantId: string) {
    // 🔒 安全修复：校验报价单归属当前租户
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
      columns: { id: true, status: true },
    });
    if (!quote) throw new Error('报价单不存在或无权操作');

    // P1-01: 状态机校验，防止绕过提交/风控流程
    if (quote.status !== 'PENDING_APPROVAL') {
      throw new Error(`无法批准状态为 ${quote.status} 的报价单，必须为待审批状态`);
    }

    const result = await db
      .update(quotes)
      .set({
        status: 'APPROVED',
        approvedAt: new Date(),
        approverId: approverId,
        approvalRequired: false,
        rejectReason: null,
      })
      .where(
        and(
          eq(quotes.id, quoteId),
          eq(quotes.tenantId, tenantId),
          // 🔒 安全修复：乐观锁
          eq(quotes.status, 'PENDING_APPROVAL')
        )
      );

    if (result.count === 0) {
      throw new Error('操作失败：报价单状态已变更或不满足批准条件');
    }

    return result;
  }

  static async reject(quoteId: string, reason: string, tenantId: string) {
    // 🔒 安全修复：校验报价单归属当前租户
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
      columns: { id: true, status: true },
    });
    if (!quote) throw new Error('报价单不存在或无权操作');

    // P1-01: 状态机校验
    if (quote.status !== 'PENDING_APPROVAL' && quote.status !== 'PENDING_CUSTOMER') {
      throw new Error(`无法拒绝状态为 ${quote.status} 的报价单`);
    }

    const result = await db
      .update(quotes)
      .set({
        status: 'REJECTED',
        rejectReason: reason,
        approvalRequired: false,
      })
      .where(
        and(
          eq(quotes.id, quoteId),
          eq(quotes.tenantId, tenantId),
          // 🔒 安全修复：乐观锁，只允许拒绝审批中或待确认的报价单
          // 注意：此处直接使用 quote.status 可能存在风险如果查询后状态变了，所以最好显式列出允许的状态
          // 但由于 reject 允许 PENDING_APPROVAL 或 PENDING_CUSTOMER，我们使用 inArray 若 drizzle 支持，或使用 quote.status
          eq(quotes.status, quote.status!)
        )
      );

    if (result.count === 0) {
      throw new Error('操作失败：报价单状态已变更，无法拒绝');
    }

    return result;
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

      // 🔒 关键安全修复：先更新 Quote 状态以锁定（乐观锁），防止并发重复转单
      // 必须在创建 Order 之前执行，确保只有一个事务能成功将状态转为 ORDERED
      const updateResult = await tx
        .update(quotes)
        .set({ status: 'ORDERED', lockedAt: new Date() })
        .where(
          and(
            eq(quotes.id, quoteId),
            eq(quotes.tenantId, tenantId),
            // 只允许从 PENDING_CUSTOMER 或 APPROVED 转单
            // 这里我们使用查询时获取的状态，或者更严格地显式指定
            eq(quotes.status, quote.status!)
          )
        );

      if (updateResult.count === 0) {
        throw new Error('操作失败：报价单状态已变更，无法转订单（可能已被处理）');
      }

      const orderNo = `ORD-${new Date().getTime().toString().slice(-8)}`;

      // P1-06 安全修复：customer 查询添加租户隔离
      const customer = await tx.query.customers.findFirst({
        where: and(eq(customers.id, quote.customerId), eq(customers.tenantId, tenantId)),
      });

      // 🔒 P1-R4-02 安全修复：地址查询添加租户隔离
      const addressParams = await tx.query.customerAddresses.findFirst({
        where: and(
          eq(customerAddresses.customerId, quote.customerId),
          eq(customerAddresses.tenantId, tenantId)
        ),
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

      // Quote update moved to top

      return newOrder;
    });
  }

  /**
   * 过期处理自动化 (Check for Expirations)
   * 自动将超过 validUntil 的报价单标记为 EXPIRED
   */
  static async checkExpirations(tenantId: string) {
    const now = new Date();
    const result = await db
      .update(quotes)
      .set({ status: 'EXPIRED' })
      .where(
        and(
          eq(quotes.tenantId, tenantId),
          eq(quotes.status, 'PENDING_CUSTOMER'), // 已发送给客户的才需要过期
          lt(quotes.validUntil, now)
        )
      )
      .returning({ id: quotes.id });

    return result.length;
  }
}
