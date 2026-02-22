/**
 * 报价单确认 API
 *
 * POST /api/miniprogram/quotes/[id]/confirm
 * 客户确认报价单并上传签名
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../../auth-utils';
import { ConfirmQuoteSchema } from '../../../miniprogram-schemas';
import { AuditService } from '@/shared/services/audit-service';
import { RateLimiter } from '@/shared/services/miniprogram/security.service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user) {
      return apiError('未授权', 401);
    }

    // 频控：单用户每 3 秒最多确认 1 次
    if (!RateLimiter.allow(`confirm_quote_${user.id}`, 1, 3000)) {
      return apiError('操作太频繁，请稍后再试', 429);
    }

    const { id } = await context.params;
    const body = await request.json();

    // Zod 输入验证
    const parsed = ConfirmQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { signatureUrl } = parsed.data;

    // 查询报价单（含租户隔离 + 状态校验）
    const existingQuote = await db
      .select({ id: quotes.id, status: quotes.status })
      .from(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.tenantId, user.tenantId)))
      .limit(1);

    if (!existingQuote.length) {
      return apiError('报价单不存在', 404);
    }

    // 状态校验：只有待客户确认状态才能确认
    if (existingQuote[0].status !== 'PENDING_APPROVAL') {
      return apiError('当前状态不允许确认', 400);
    }

    // 更新报价单状态（带 tenantId 二次防线）
    await db
      .update(quotes)
      .set({
        status: 'ACCEPTED',
        customerSignatureUrl: signatureUrl,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.id, id), eq(quotes.tenantId, user.tenantId)));

    // 审计日志
    await AuditService.log(db, {
      tableName: 'quotes',
      recordId: id,
      action: 'CUSTOMER_CONFIRM',
      userId: user.id,
      tenantId: user.tenantId,
      details: { signatureUrl }
    });

    logger.info('[Quotes] 报价单确认成功', {
      route: 'quotes/confirm',
      quoteId: id,
      userId: user.id,
      tenantId: user.tenantId,
    });

    return apiSuccess({ status: 'ACCEPTED' });
  } catch (error) {
    logger.error('[Quotes] 报价单确认失败', { route: 'quotes/confirm', error });
    return apiError('确认报价失败', 500);
  }
}
