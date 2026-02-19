
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { leads, quotes, orders } from '@/shared/api/schema';
import { and, eq, gte, inArray, ne, sql } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';


const log = createLogger('mobile/dashboard/funnel');
export async function GET(request: NextRequest) {
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;

    const isSales = requireSales(auth.session);
    if (!isSales.allowed) return isSales.response;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    let days = 30;
    if (range === '7d') days = 7;
    if (range === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        // 并行查询漏斗各阶段数据
        const [leadsCount, quotesCount, ordersCount, paidOrdersCount] = await Promise.all([
            // 1. 线索数
            db.select({ count: sql<number>`count(*)::int` })
                .from(leads)
                .where(and(eq(leads.tenantId, auth.session.tenantId), gte(leads.createdAt, startDate))),

            // 2. 报价数 (已提交/审批通过)
            db.select({ count: sql<number>`count(*)::int` })
                .from(quotes)
                .where(and(
                    eq(quotes.tenantId, auth.session.tenantId),
                    gte(quotes.createdAt, startDate),
                    ne(quotes.status, 'DRAFT') // 排除草稿
                )),

            // 3. 订单数 (下单)
            db.select({ count: sql<number>`count(*)::int` })
                .from(orders)
                .where(and(eq(orders.tenantId, auth.session.tenantId), gte(orders.createdAt, startDate))),

            // 4. 成交数 (已支付/完成)
            db.select({ count: sql<number>`count(*)::int` })
                .from(orders)
                .where(and(
                    eq(orders.tenantId, auth.session.tenantId),
                    gte(orders.createdAt, startDate),
                    inArray(orders.status, ['PAID', 'COMPLETED', 'PENDING_PRODUCTION', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALL', 'INSTALLATION_COMPLETED'])
                )),
        ]);

        const funnelData = {
            leads: leadsCount[0]?.count ?? 0,
            opportunities: leadsCount[0]?.count ?? 0, // 增加 opportunities 字段，暂时复用 leadsCount
            quotes: quotesCount[0]?.count ?? 0,
            orders: ordersCount[0]?.count ?? 0,
            sales: paidOrdersCount[0]?.count ?? 0,
        };

        return apiSuccess(funnelData);
    } catch (error) {
        log.error('[Mobile API][dashboard] 漏斗查询错误', {}, error);
        return apiError('获取销售漏斗数据失败', 500);
    }
}
