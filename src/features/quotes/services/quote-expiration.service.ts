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
     * 用于单个报价访问时的实时检查
     * 
     * @param quoteId - 报价ID
     * @param tenantId - 租户ID
     * @returns 是否已过期
     */
    static async checkAndExpireQuote(quoteId: string, tenantId: string): Promise<{ expired: boolean; expiredAt?: Date }> {
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId))
        });

        if (!quote) throw new Error('Quote not found');

        // 如果已是 EXPIRED 状态，直接返回
        if (quote.status === 'EXPIRED') {
            return { expired: true, expiredAt: quote.updatedAt ?? undefined };
        }

        // 检查是否需要过期（validUntil 已过期且状态不是已确认/已拒绝）
        const now = new Date();
        const validUntil = quote.validUntil;
        const canExpire = quote.status === 'DRAFT' || quote.status === 'PENDING_APPROVAL' || quote.status === 'PENDING_CUSTOMER';

        if (validUntil && validUntil < now && canExpire) {
            // 更新状态为 EXPIRED
            await db.update(quotes)
                .set({
                    status: 'EXPIRED',
                    updatedAt: now
                })
                .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

            return { expired: true, expiredAt: now };
        }

        return { expired: false };
    }

    /**
     * 批量过期处理 (Batch Expire Overdue Quotes)
     * 用于定时任务/Cron Job，批量处理所有过期报价
     * 
     * @param tenantId - 可选，限定租户范围
     * @returns 处理结果统计
     */
    static async expireAllOverdueQuotes(tenantId?: string): Promise<{ processed: number; expired: number }> {
        const now = new Date();

        // 构建查询条件
        const conditions = [
            lt(quotes.validUntil, now),
            inArray(quotes.status, ['DRAFT', 'PENDING_APPROVAL', 'PENDING_CUSTOMER'])
        ];

        if (tenantId) {
            conditions.push(eq(quotes.tenantId, tenantId));
        }

        // 查找所有过期报价
        const overdueQuotes = await db.query.quotes.findMany({
            where: and(...conditions),
            columns: { id: true }
        });

        if (overdueQuotes.length === 0) {
            return { processed: 0, expired: 0 };
        }

        const quoteIds = overdueQuotes.map(q => q.id);

        // 批量更新状态
        await db.update(quotes)
            .set({
                status: 'EXPIRED',
                updatedAt: now
            })
            .where(inArray(quotes.id, quoteIds));

        return { processed: quoteIds.length, expired: quoteIds.length };
    }

    /**
     * 刷新过期报价价格 (Refresh Expired Quote Prices)
     * 当客户重新确认过期报价时，刷新所有商品价格为最新价格
     * 
     * @param quoteId - 报价ID
     * @param tenantId - 租户ID
     * @param newValidDays - 新的有效期天数（默认7天）
     * @returns 刷新后的报价
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
            with: { items: true }
        });

        if (!quote) throw new Error('Quote not found');

        // 仅允许 EXPIRED 或 DRAFT 状态的报价刷新价格
        if (quote.status !== 'EXPIRED' && quote.status !== 'DRAFT') {
            throw new Error('只有已过期或草稿状态的报价可以刷新价格');
        }

        const itemIds = quote.items
            .filter(item => item.productId)
            .map(item => item.productId as string);

        if (itemIds.length === 0) {
            return { success: true, updatedItems: 0, priceChanges: [], newValidUntil: new Date() };
        }

        // 批量查询商品价格，避免 N+1 查询
        const productsList = await db.query.products.findMany({
            where: and(inArray(products.id, itemIds), eq(products.tenantId, tenantId)),
            columns: { id: true, retailPrice: true }
        });

        const productPriceMap = new Map(productsList.map(p => [p.id, Number(p.retailPrice)]));
        const priceChanges: { itemId: string; oldPrice: number; newPrice: number }[] = [];
        let updatedItems = 0;

        await db.transaction(async (tx) => {
            for (const item of quote.items) {
                if (!item.productId) continue;

                const newPrice = productPriceMap.get(item.productId);
                if (newPrice === undefined) continue;

                const oldPrice = Number(item.unitPrice);

                // 如果价格有变化，更新报价项
                if (Math.abs(oldPrice - newPrice) > 0.01) {
                    const newSubtotal = Math.round(newPrice * Number(item.quantity) * 100) / 100;

                    await tx.update(quoteItems)
                        .set({
                            unitPrice: newPrice.toFixed(2),
                            subtotal: newSubtotal.toFixed(2),
                            updatedAt: new Date()
                        })
                        .where(and(eq(quoteItems.id, item.id), eq(quoteItems.tenantId, tenantId)));

                    priceChanges.push({
                        itemId: item.id,
                        oldPrice,
                        newPrice
                    });
                    updatedItems++;
                }
            }

            // 重新计算总额
            const updatedItemsList = await tx.query.quoteItems.findMany({
                where: and(eq(quoteItems.quoteId, quoteId), eq(quoteItems.tenantId, tenantId)),
            });
            const totalDec = updatedItemsList.reduce(
                (acc, item) => acc.plus(new Decimal(item.subtotal || 0)),
                new Decimal(0)
            );

            // 计算新的有效期并更新状态
            const newValidUntil = new Date();
            newValidUntil.setDate(newValidUntil.getDate() + newValidDays);

            await tx.update(quotes)
                .set({
                    totalAmount: totalDec.toFixed(2),
                    finalAmount: totalDec.toFixed(2),
                    status: 'DRAFT',
                    validUntil: newValidUntil,
                    updatedAt: new Date()
                })
                .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));
        });

        const newValidUntil = new Date();
        newValidUntil.setDate(newValidUntil.getDate() + newValidDays);

        return {
            success: true,
            updatedItems,
            priceChanges,
            newValidUntil
        };
    }
}
