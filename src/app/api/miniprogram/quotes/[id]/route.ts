/**
 * 获取报价单详情 API
 *
 * GET /api/miniprogram/quotes/[id]
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes, quoteItems, customers } from '@/shared/api/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiNotFound,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../auth-utils';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
    try {
      // 1. 认证检查

      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const { id } = await context.params;

      if (!id) {
        return apiBadRequest('缺少 ID');
      }

      // 2. 查询报价单（添加 tenantId 过滤）
      const quote = await db.query.quotes.findFirst({
        where: and(eq(quotes.id, id), eq(quotes.tenantId, user.tenantId)),
        with: {
          customer: true,
        },
      });

      if (!quote) {
        return apiNotFound('报价单不存在');
      }

      // 安全隔离：CUSTOMER 角色必须校验报价单归属权，防止横向越权 (IDOR)
      // 通过 customers 表反查该用户绑定的 Customer 档案，对比报价单中的 customerId
      if (user.role?.toUpperCase() === 'CUSTOMER') {
        const customerRecord = await db.query.customers.findFirst({
          where: and(eq(customers.tenantId, user.tenantId), eq(customers.createdBy, user.id)),
          columns: { id: true },
        });

        // 找不到档案，或该报价单不属于此客户 → 返回 404（不暴露资源存在性）
        if (!customerRecord || quote.customerId !== customerRecord.id) {
          logger.warn('[Quotes] CUSTOMER 角色尝试访问非归属报价单，已拦截', {
            userId: user.id,
            tenantId: user.tenantId,
            quoteId: id,
            quotedCustomerId: quote.customerId,
            actualCustomerId: customerRecord?.id,
          });
          return apiNotFound('报价单不存在');
        }
      }

      let customerName = '未知客户';
      if (quote.customerId) {
        const customer = await db.query.customers.findFirst({
          where: and(eq(customers.id, quote.customerId), eq(customers.tenantId, user.tenantId)),
        });
        if (customer) customerName = customer.name;
      }

      // 3. 查询报价项（添加 tenantId 过滤）
      const items = await db.query.quoteItems.findMany({
        where: and(eq(quoteItems.quoteId, id), eq(quoteItems.tenantId, user.tenantId)),
        orderBy: [quoteItems.sortOrder],
      });

      // 4. 查询关联版本（方案 B 追加）
      const rootId = quote.rootQuoteId || quote.id;
      const versions = await db.query.quotes.findMany({
        columns: { id: true, version: true, status: true, createdAt: true },
        where: and(
          or(eq(quotes.rootQuoteId, rootId), eq(quotes.id, rootId)),
          eq(quotes.tenantId, user.tenantId)
        ),
        orderBy: desc(quotes.version),
      });

      // 5. Format Response
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
        versions: versions,
      };

      return apiSuccess(data);
    } catch (error) {
      logger.error('Fetch quote error:', error);
      return apiServerError('获取报价单失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN', 'CUSTOMER']
);
