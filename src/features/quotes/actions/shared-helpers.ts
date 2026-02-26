/**
 * 报价单 Action 共享辅助函数
 * 从 mutations.ts 中提取的计算和更新工具
 */

import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { eq, and } from 'drizzle-orm';
import { DiscountControlService } from '@/services/discount-control.service';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * 计算行项目小计 (Calculate Item Subtotal)
 * 采用 Decimal.js 确保浮点数计算精度。
 * 公式：(单价 * 数量) + 加工费
 *
 * @param price - 单价
 * @param quantity - 数量
 * @param processFee - 加工费（可选，默认为 0）
 * @returns 保留两位小数的小计金额
 */
import Decimal from 'decimal.js';

/**
 * 更新报价单总金额 (Update Quote Total)
 * 核心逻辑：
 * 1. 汇总所有行项目小计。
 * 2. 应用报价单级别的折扣率 (discountRate) 和折减金额 (discountAmount)。
 * 3. 检查折扣是否触发审批流。
 * 4. 持久化总额数据，并同步更新所属套餐 (Bundle) 的金额。
 *
 * @param quoteId - 报价单 ID
 * @param tenantId - 租户 ID（用于隔离）
 */
export const updateQuoteTotal = async (quoteId: string, tenantId: string) => {
  // 1. 获取报价单当前折扣设置
  const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
  });

  if (!quote) return;

  // 2. 汇总所有行项目
  const items = await db.query.quoteItems.findMany({
    where: and(eq(quoteItems.quoteId, quoteId), eq(quoteItems.tenantId, tenantId)),
  });

  // 使用 Decimal 汇总
  const totalDec = items.reduce(
    (acc, item) => acc.plus(new Decimal(item.subtotal || 0)),
    new Decimal(0)
  );

  const discountRate = Number(quote.discountRate || 1);
  const discountAmount = Number(quote.discountAmount || 0);

  // 3. 计算最终金额
  const discountRateDec = new Decimal(discountRate);
  const discountAmountDec = new Decimal(discountAmount);

  // final = total * rate - amount
  const finalDec = totalDec.mul(discountRateDec).sub(discountAmountDec);
  const finalAmount = Math.max(0, finalDec.toNumber());

  // 4. 检查是否需要审批
  const requiresApproval = await DiscountControlService.checkRequiresApproval(
    quote.tenantId,
    discountRate
  );

  await db
    .update(quotes)
    .set({
      totalAmount: totalDec.toFixed(2),
      finalAmount: new Decimal(finalAmount).toFixed(2),
      approvalRequired: requiresApproval,
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

  // 5. 若为子报价（有 bundleId），同步更新套餐总额
  if (quote.bundleId) {
    await updateBundleTotal(quote.bundleId, tenantId);
  }
};

/**
 * 更新套餐报价总金额 (Update Bundle Total)
 * 汇总套餐下所有子报价单的金额数据（总额、折减、最终金额）。
 *
 * @param bundleId - 套餐报价单 ID
 * @param tenantId - 租户 ID
 */
export const updateBundleTotal = async (bundleId: string, tenantId: string) => {
  const subQuotes = await db.query.quotes.findMany({
    where: and(eq(quotes.bundleId, bundleId), eq(quotes.tenantId, tenantId)),
  });

  // 聚合所有子报价的金额
  let bundleTotalAmount = new Decimal(0);
  let bundleDiscountAmount = new Decimal(0);
  let bundleFinalAmount = new Decimal(0);

  for (const q of subQuotes) {
    bundleTotalAmount = bundleTotalAmount.plus(q.totalAmount || 0);
    bundleDiscountAmount = bundleDiscountAmount.plus(q.discountAmount || 0);
    bundleFinalAmount = bundleFinalAmount.plus(q.finalAmount || 0);
  }

  await db
    .update(quotes)
    .set({
      totalAmount: bundleTotalAmount.toFixed(2),
      discountAmount: bundleDiscountAmount.toFixed(2),
      finalAmount: bundleFinalAmount.toFixed(2),
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, bundleId), eq(quotes.tenantId, tenantId)));

  revalidatePath(`/quotes/${bundleId}`);
  revalidatePath('/quotes');
  revalidateTag('quotes', {});
};
