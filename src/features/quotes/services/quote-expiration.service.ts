import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { products } from '@/shared/api/schema/catalogs';
import { eq, and, lt, inArray } from 'drizzle-orm';
import Decimal from 'decimal.js';

/**
 * 报价单过期与价格刷新服务 (Quote Expiration Service)
 * 专门处理报价单的过期检查、批量过期处理及价格刷新等任务。
 */
export class QuoteExpirationService {
  /**
   * 检查并标记过期报价 (Check and Expire Quote)
   * 用于单个报价单访问或状态转移时的临界安全守卫层实时检查。若超期则直接在此刻强行更变为失效态。
   *
   * @param quoteId - 定位唯一标的物的报价单主键标识
   * @param tenantId - 安全控制领域所需的统一隔离标识
   * @returns 携带包含最新当前是否已过期状态的回执反馈判定字典对象
   * @throws {Error} 若查无此单抛出此异常，阻止下游继续执行
   *
   * @example
   * const res = await QuoteExpirationService.checkAndExpireQuote(id, tId);
   */
  static async checkAndExpireQuote(
    quoteId: string,
    tenantId: string
  ): Promise<{ expired: boolean; expiredAt?: Date }> {
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
    });

    if (!quote) throw new Error('Quote not found');

    /** 解析判定出前置动作若已经落盘属于 EXPIRED 彻底作废终结状态，那么直接判定回传，削减后续性能开销 */
    if (quote.status === 'EXPIRED') {
      return { expired: true, expiredAt: quote.updatedAt ?? undefined };
    }

    /** 检查是否需要在符合条件后主动废弃过期单据（validUntil 已过期且状态不是已确认/已拒绝） */
    const now = new Date();
    const validUntil = quote.validUntil;
    const canExpire =
      quote.status === 'DRAFT' ||
      quote.status === 'PENDING_APPROVAL' ||
      quote.status === 'PENDING_CUSTOMER';

    if (validUntil && validUntil < now && canExpire) {
      /** 落盘更新状态为完全失效的 EXPIRED */
      await db
        .update(quotes)
        .set({
          status: 'EXPIRED',
          updatedAt: now,
        })
        .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

      return { expired: true, expiredAt: now };
    }

    return { expired: false };
  }

  /**
   * 批量过期清理处理 (Batch Expire Overdue Quotes)
   * 往往集成于应用层的定时任务/Cron Job 之内，通过扫表一次性清理掉符合预期时间边界的所有超期草稿、等待确认待批覆状态之报价单。
   *
   * @param tenantId - (可选) 限定为具体某一个指定租户下的范围，否则不作隔离批量全局
   * @returns 宣告包含命中检索总数以及成功降级转化总数的处理回检报告结果
   */
  static async expireAllOverdueQuotes(
    tenantId?: string
  ): Promise<{ processed: number; expired: number }> {
    const now = new Date();

    /** 按条件层层叠挂构建复杂的复合式检索逻辑条件集 */
    const conditions = [
      lt(quotes.validUntil, now),
      inArray(quotes.status, ['DRAFT', 'PENDING_APPROVAL', 'PENDING_CUSTOMER']),
    ];

    if (tenantId) {
      conditions.push(eq(quotes.tenantId, tenantId));
    }

    /** 构建并发并拉取所有被精准锁定到的超期但尚为存续活跃阶段流转控制字段的失位订单 */
    const overdueQuotes = await db.query.quotes.findMany({
      where: and(...conditions),
      columns: { id: true },
    });

    if (overdueQuotes.length === 0) {
      return { processed: 0, expired: 0 };
    }

    const quoteIds = overdueQuotes.map((q) => q.id);

    /** 集中开启批量高效直通式的状态覆压落地事务，抹平这些过往无效凭证为 EXPIRED 终态 */
    await db
      .update(quotes)
      .set({
        status: 'EXPIRED',
        updatedAt: now,
      })
      .where(inArray(quotes.id, quoteIds));

    return { processed: quoteIds.length, expired: quoteIds.length };
  }

  /**
   * 重载与刷新处于疲软状态过期报价的实时最新价格体系 (Refresh Expired Quote Prices)
   * 当买卖双方试图打捞重新确认过期报价历史时，由于物料库存和造价极有可能大幅更迭，由此触发强制拉取最新挂牌价刷新所有商品主件成本。
   *
   * @param quoteId - 具体哪一张报价单的识别序列号
   * @param tenantId - 合法权属人的租户隔离安全校验 ID 值
   * @param newValidDays - 续期复生的新有效倒计日期范围（默认配置为 7 天长度）
   * @returns 汇总了本次刷新变动细则成功标志、受牵连记录笔数、明细价目新老映射，及到期复活截止时间的集合对象
   * @throws {Error} 尝试刷新不存在，或者本身尚未满足超限失活标准的无权报价单时阻挡异常抛出
   */
  static async refreshExpiredQuotePrices(
    quoteId: string,
    tenantId: string,
    newValidDays: number = 7
  ): Promise<{
    success: boolean;
    updatedItems: number;
    priceChanges: { itemId: string; oldPrice: number; newPrice: number }[];
    newValidUntil: Date;
  }> {
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
      with: { items: true },
    });

    if (!quote) throw new Error('Quote not found');

    /** 为防止被非法串改，仅允许原本就是 EXPIRED 或 DRAFT 状态的非正规成型报价单可以随意刷新价格重组 */
    if (quote.status !== 'EXPIRED' && quote.status !== 'DRAFT') {
      throw new Error('只有已过期或草稿状态的报价可以刷新价格');
    }

    const itemIds = quote.items
      .filter((item) => item.productId)
      .map((item) => item.productId as string);

    if (itemIds.length === 0) {
      return { success: true, updatedItems: 0, priceChanges: [], newValidUntil: new Date() };
    }

    /** 防患于未然：展开大批量的外键 ID 拉起商品最新全系价表缓存字典映射，极大的避免 N+1 恶劣重查询困境陷阱 */
    const productsList = await db.query.products.findMany({
      where: and(inArray(products.id, itemIds), eq(products.tenantId, tenantId)),
      columns: { id: true, retailPrice: true },
    });

    const productPriceMap = new Map(productsList.map((p) => [p.id, Number(p.retailPrice)]));
    const priceChanges: { itemId: string; oldPrice: number; newPrice: number }[] = [];
    let updatedItems = 0;

    await db.transaction(async (tx) => {
      for (const item of quote.items) {
        if (!item.productId) continue;

        const newPrice = productPriceMap.get(item.productId);
        if (newPrice === undefined) continue;

        const oldPrice = Number(item.unitPrice);

        /** 单独校验这名个体的价格阈差是否在敏感变动线之上，若是微调则记录进日志大盘 */
        if (Math.abs(oldPrice - newPrice) > 0.01) {
          const newSubtotal = Math.round(newPrice * Number(item.quantity) * 100) / 100;

          await tx
            .update(quoteItems)
            .set({
              unitPrice: newPrice.toFixed(2),
              subtotal: newSubtotal.toFixed(2),
              updatedAt: new Date(),
            })
            .where(and(eq(quoteItems.id, item.id), eq(quoteItems.tenantId, tenantId)));

          priceChanges.push({
            itemId: item.id,
            oldPrice,
            newPrice,
          });
          updatedItems++;
        }
      }

      /** 汇拢最新全量单价与工程量，整体重新累加计算出新的预估总额与折后终额 */
      const updatedItemsList = await tx.query.quoteItems.findMany({
        where: and(eq(quoteItems.quoteId, quoteId), eq(quoteItems.tenantId, tenantId)),
      });
      const totalDec = updatedItemsList.reduce(
        (acc, item) => acc.plus(new Decimal(item.subtotal || 0)),
        new Decimal(0)
      );

      /** 基于配置系统向后顺延计算最新的有效期门槛门限点，并伴随全局数据的刷新重新更新状态机流转为草稿 */
      const newValidUntil = new Date();
      newValidUntil.setDate(newValidUntil.getDate() + newValidDays);

      await tx
        .update(quotes)
        .set({
          totalAmount: totalDec.toFixed(2),
          finalAmount: totalDec.toFixed(2),
          status: 'DRAFT',
          validUntil: newValidUntil,
          updatedAt: new Date(),
        })
        .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));
    });

    const newValidUntil = new Date();
    newValidUntil.setDate(newValidUntil.getDate() + newValidDays);

    return {
      success: true,
      updatedItems,
      priceChanges,
      newValidUntil,
    };
  }
}
