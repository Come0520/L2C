/**
 * 创建报价单 API
 *
 * POST /api/miniprogram/quotes
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes, quoteRooms, quoteItems } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../auth-utils';
import { CreateQuoteSchema } from '../miniprogram-schemas';
import { AuditService } from '@/shared/services/audit-service';
import { RateLimiter } from '@/shared/services/miniprogram/security.service';

export async function POST(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user) {
      return apiError('未授权', 401);
    }

    // 频控：单用户每 5 秒最多创建 3 个报价单
    if (!RateLimiter.allow(`create_quote_${user.id}`, 3, 5000)) {
      return apiError('操作太频繁，请稍后再试', 429);
    }

    const body = await request.json();

    // Zod 输入验证
    const parsed = CreateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { customerId, rooms } = parsed.data;

    // 事务创建
    const result = await db.transaction(async (tx) => {
      // 1. 创建报价单
      const quoteNo = `Q${Date.now()}`;

      const [newQuote] = await tx
        .insert(quotes)
        .values({
          tenantId: user.tenantId,
          quoteNo: quoteNo,
          customerId: customerId,
          createdBy: user.id,
          title: `报价单 ${quoteNo}`,
          status: 'DRAFT',
          finalAmount: '0',
          version: 1,
        })
        .returning();

      let total = 0;

      // 2. 创建房间和项目
      if (rooms && Array.isArray(rooms)) {
        for (let i = 0; i < rooms.length; i++) {
          const r = rooms[i];
          const [newRoom] = await tx
            .insert(quoteRooms)
            .values({
              tenantId: user.tenantId,
              quoteId: newQuote.id,
              name: r.name,
              sortOrder: i,
            })
            .returning();

          if (r.items && Array.isArray(r.items)) {
            for (let j = 0; j < r.items.length; j++) {
              const item = r.items[j];
              const itemSubtotal = item.subtotal || 0;
              total += itemSubtotal;

              await tx.insert(quoteItems).values({
                tenantId: user.tenantId,
                quoteId: newQuote.id,
                roomId: newRoom.id,
                productId: item.id,
                productName: item.name,
                unit: item.unit,
                unitPrice: String(item.unitPrice),
                quantity: String(item.quantity),
                width: String(item.width),
                height: String(item.height),
                foldRatio: String(item.foldRatio),
                subtotal: String(itemSubtotal),
                category: item.category || 'GENERAL',
                sortOrder: j,
              });
            }
          }
        }
      }

      // 3. 更新总金额
      await tx
        .update(quotes)
        .set({
          totalAmount: total.toFixed(2),
          finalAmount: total.toFixed(2),
        })
        .where(eq(quotes.id, newQuote.id));

      return newQuote;
    });

    // 审计日志 (容灾设计)
    try {
      await AuditService.log(db, {
        tableName: 'quotes',
        recordId: result.id,
        action: 'CREATE',
        userId: user.id,
        tenantId: user.tenantId,
        details: { customerId, totalAmount: result.totalAmount }
      });
    } catch (auditError) {
      logger.warn('[Quotes] 审计日志记录失败', { error: auditError, quoteId: result.id });
    }

    logger.info('[Quotes] 报价单创建成功', {
      route: 'quotes',
      quoteId: result.id,
      userId: user.id,
      tenantId: user.tenantId,
    });

    return apiSuccess({ id: result.id });
  } catch (error) {
    logger.error('[Quotes] 创建报价单失败', { route: 'quotes', error });
    // 安全：不向客户端暴露 error 对象
    return apiError('创建报价单失败', 500);
  }
}
