'use server';

/**
 * 报价单 Action 共享辅助函数
 * 从 mutations.ts 中提取的计算和更新工具
 */

import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { eq } from 'drizzle-orm';
import { DiscountControlService } from '@/services/discount-control.service';

/**
 * 计算行项目小计
 * @param price - 单价
 * @param quantity - 数量
 * @param processFee - 加工费（可选）
 */
export const calculateSubtotal = (price: number, quantity: number, processFee: number = 0) => {
  return price * quantity + processFee;
};

/**
 * 更新报价单总金额
 * 重新汇总所有行项目，应用折扣后更新总额和最终金额
 */
export const updateQuoteTotal = async (quoteId: string) => {
  // 1. 获取报价单当前折扣设置
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
  });

  if (!quote) return;

  // 2. 汇总所有行项目
  const items = await db.query.quoteItems.findMany({
    where: eq(quoteItems.quoteId, quoteId),
  });

  const total = items.reduce((acc, item) => acc + Number(item.subtotal), 0);
  const discountRate = Number(quote.discountRate || 1);
  const discountAmount = Number(quote.discountAmount || 0);

  // 3. 计算最终金额
  const finalAmount = Math.max(0, total * discountRate - discountAmount);

  // 4. 检查是否需要审批
  const requiresApproval = await DiscountControlService.checkRequiresApproval(
    quote.tenantId,
    discountRate
  );

  await db
    .update(quotes)
    .set({
      totalAmount: total.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      approvalRequired: requiresApproval,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId));

  // 5. 若为子报价（有 bundleId），同步更新套餐总额
  if (quote.bundleId) {
    await updateBundleTotal(quote.bundleId);
  }
};

/**
 * 更新套餐报价总金额
 * 汇总套餐下所有子报价的最终金额
 */
export const updateBundleTotal = async (bundleId: string) => {
  const subQuotes = await db.query.quotes.findMany({
    where: eq(quotes.bundleId, bundleId),
  });

  const bundleTotal = subQuotes.reduce((acc, q) => acc + Number(q.finalAmount || 0), 0);

  await db
    .update(quotes)
    .set({
      totalAmount: bundleTotal.toFixed(2),
      finalAmount: bundleTotal.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, bundleId));
};
