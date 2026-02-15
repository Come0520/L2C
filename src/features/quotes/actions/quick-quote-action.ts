'use server';

/**
 * 快速报价 Actions
 * 包含：createQuickQuote
 */

import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { eq, type InferSelectModel } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { CustomerService } from '@/services/customer.service';
import { createQuickQuoteSchema } from './schema';
import { updateQuoteTotal } from './shared-helpers';
import { leads } from '@/shared/api/schema/leads';
import { fetchQuotePlans } from '../lib/plan-loader';

// ─── 快速报价 ───────────────────────────────────

export const createQuickQuote = createSafeAction(createQuickQuoteSchema, async (data, context) => {
  const { leadId, planType, rooms } = data;
  const tenantId = context.session.user.tenantId;
  const userId = context.session.user.id;

  // 1. 验证线索
  const lead = (await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
  })) as InferSelectModel<typeof leads> | undefined;
  if (!lead) throw new Error('线索不存在');

  // 2. 确保客户存在
  let customerId = lead.customerId;
  if (!customerId) {
    // 自动创建客户
    const newCustomerResult = await CustomerService.createCustomer(
      {
        name: lead.customerName || '快速报价客户',
        phone: lead.customerPhone || '',
        wechat: lead.customerWechat || null,
        preferences: { source: 'LEAD_CONVERSION' },
        type: 'INDIVIDUAL',
        lifecycleStage: 'LEAD',
        pipelineStatus: 'UNASSIGNED',
      },
      tenantId,
      userId
    );
    customerId = newCustomerResult.customer.id;

    await db
      .update(leads)
      .set({ customerId: newCustomerResult.customer.id })
      .where(eq(leads.id, leadId));
  }

  // 3. 创建报价单（编号含随机后缀防碰撞）
  const quoteNo = `QQ${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const [newQuote] = await db
    .insert(quotes)
    .values({
      quoteNo,
      tenantId,
      customerId,
      leadId,
      title: `快速报价 - ${planType}`,
      status: 'DRAFT',
      createdBy: userId,
    })
    .returning();

  await db.update(quotes).set({ rootQuoteId: newQuote.id }).where(eq(quotes.id, newQuote.id));

  // 4. 加载套餐数据
  const allPlans = await fetchQuotePlans(tenantId);

  type MockProduct = { category?: string; name?: string; unitPrice?: number; foldRatio?: number };
  type MockPlan = { products?: Record<string, MockProduct> };

  const plan = (allPlans as Record<string, MockPlan>)[planType];
  if (!plan) {
    throw new Error(`套餐 ${planType} 不存在`);
  }

  // 5. 创建房间和行项目
  for (const roomData of rooms) {
    const [room] = await db
      .insert(quoteRooms)
      .values({
        quoteId: newQuote.id,
        tenantId,
        name: roomData.name,
      })
      .returning();

    for (const [key, product] of Object.entries(plan.products || {})) {
      const p = product;

      // 根据房间配置跳过不需要的项目
      if (key === 'sheer' && !roomData.hasSheer) continue;
      if (key === 'fabric' && roomData.hasFabric === false) continue;

      const quantity = roomData.width * (p.foldRatio || 2);
      const subtotal = quantity * (p.unitPrice || 0);

      await db.insert(quoteItems).values({
        quoteId: newQuote.id,
        roomId: room.id,
        tenantId,
        category: p.category || 'OTHER',
        productName: p.name || key,
        unitPrice: (p.unitPrice || 0).toString(),
        quantity: quantity.toString(),
        subtotal: subtotal.toString(),
        width: roomData.width.toString(),
        height: roomData.height.toString(),
      });
    }
  }

  // 6. 更新报价单总额
  await updateQuoteTotal(newQuote.id);

  revalidatePath('/quotes');
  return { id: newQuote.id, quoteNo };
});
