/**
 * 获取报价单详情 API
 *
 * GET /api/miniprogram/quotes/[id]
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes, quoteItems, customers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';



export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 1. 认证检查
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const { id } = await context.params;

    if (!id) {
      return apiError('缺少 ID', 400);
    }

    // 2. 查询报价单（添加 tenantId 过滤）
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, id), eq(quotes.tenantId, user.tenantId)),
      with: {
        customer: true,
      },
    });

    if (!quote) {
      return apiError('报价单不存在', 404);
    }

    let customerName = '未知客户';
    if (quote.customerId) {
      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.id, quote.customerId),
          eq(customers.tenantId, user.tenantId)
        ),
      });
      if (customer) customerName = customer.name;
    }

    // 3. 查询报价项（添加 tenantId 过滤）
    const items = await db.query.quoteItems.findMany({
      where: and(
        eq(quoteItems.quoteId, id),
        eq(quoteItems.tenantId, user.tenantId)
      ),
      orderBy: [quoteItems.sortOrder],
    });

    // 4. Format Response
    const data = {
      id: quote.id,
      quoteNo: quote.quoteNo,
      title: quote.title,
      customerName: customerName,
      totalAmount: quote.totalAmount,
      finalAmount: quote.finalAmount,
      status: quote.status,
      customerSignatureUrl: quote.customerSignatureUrl,
      confirmedAt: quote.confirmedAt,
      items: items.map((item) => ({
        id: item.id,
        productName: item.productName,
        roomName: item.roomName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        attributes: item.attributes,
      })),
    };

    return apiSuccess(data);
  } catch (error) {
    logger.error('Fetch quote error:', error);
    return apiError('获取报价单失败', 500);
  }
}
