'use server';
import { logger } from '@/shared/lib/logger';
import { revalidateTag } from 'next/cache';

/**
 * 快速报价 Actions
 * 包含：createQuickQuote
 */

import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { StrategyFactory } from '@/features/quotes/calc-strategies';
import { eq, and, type InferSelectModel } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { CustomerService } from '@/services/customer.service';
import { createQuickQuoteSchema } from './schema';
import { updateQuoteTotal } from './shared-helpers';
/**
 * 快速报价 Actions (Quick Quote Actions)
 * 提供从线索直接生成基于预定义套餐的报价单的能力。
 */
import { leads } from '@/shared/api/schema/leads';
import { fetchQuotePlans } from '../lib/plan-loader';

// ─── 快速报价 ───────────────────────────────────

/**
 * 客户端调用：执行快速报价 (Create Quick Quote)
 * 场景：销售在沟通初期通过少量核心参数（宽、高、单价）迅速生成一份报价草案。
 * 逻辑：
 * 1. 自动创建默认客户（若未指定）。
 * 2. 创建报价单记录。
 * 3. 依据所选分类（窗帘/墙纸等）调用工厂逻辑计算首行明细。
 * 
 * @param params - 包含客户、产品及计算核心参数的对象
 * @returns 新建的快速报价单对象
 */
export const createQuickQuote = createSafeAction(createQuickQuoteSchema, async (data, context) => {
  const { leadId, planType, rooms } = data;
  const tenantId = context.session.user.tenantId;
  const userId = context.session.user.id;

  // 1. 验证线索
  const lead = (await db.query.leads.findFirst({
    where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)),
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

    // 🔒 P0-01 安全修复：leads UPDATE 添加租户隔离
    await db
      .update(leads)
      .set({ customerId: newCustomerResult.customer.id })
      .where(and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)));
  }

  // 3. 创建报价单
  // P2-03 修复：使用 crypto.randomUUID 降低编号碰撞风险
  const quoteNo = `QQ${Date.now().toString().slice(-8)}-${crypto.randomUUID().substring(0, 6).toUpperCase()}`;

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

  // P1-04 修复：补充 fabricWidth、extraParams 等字段类型
  type MockProduct = {
    category?: string;
    name?: string;
    unitPrice?: number;
    foldRatio?: number;
    fabricWidth?: number;
    extraParams?: Record<string, unknown>;
  };
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

    const itemsToInsert: (typeof quoteItems.$inferInsert)[] = [];

    for (const [key, product] of Object.entries(plan.products || {})) {
      const p = product;

      // 根据房间配置跳过不需要的项目
      if (key === 'sheer' && !roomData.hasSheer) continue;
      if (key === 'fabric' && roomData.hasFabric === false) continue;

      // 使用策略工厂进行计算
      const Calculator = StrategyFactory.getStrategy(p.category ?? 'OTHER');
      // P2-05 修复：默认幅宽应从配置获取，此处使用常量作为兜底
      const DEFAULT_FABRIC_WIDTH = 280;
      const calcResult = Calculator.calculate({
        measuredWidth: roomData.width,
        measuredHeight: roomData.height,
        fabricWidth: p.fabricWidth || DEFAULT_FABRIC_WIDTH,
        foldRatio: p.foldRatio || 2,
        measureUnit: 'cm',
        patternRepeat: 0,
        ...(p.extraParams || {})
      });

      // P1-04 修复：使用 usage（CalcResult 统一字段名），并修复浮点精度
      const quantity = (calcResult as { usage?: number; quantity?: number }).usage
        ?? (calcResult as { usage?: number; quantity?: number }).quantity
        ?? 0;
      const subtotal = Math.round(quantity * (p.unitPrice || 0) * 100) / 100;

      itemsToInsert.push({
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

    if (itemsToInsert.length > 0) {
      await db.insert(quoteItems).values(itemsToInsert);
    }
  }

  // 6. 更新报价单总额
  await updateQuoteTotal(newQuote.id, tenantId);

  revalidatePath('/quotes');
  revalidateTag('quotes', 'default');
  logger.info('[quotes] 快速报价单创建成功', { quoteId: newQuote.id, quoteNo, leadId: data.leadId });
  return { id: newQuote.id, quoteNo };
});
