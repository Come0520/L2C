/**
 * 确认报价单 API
 *
 * POST /api/miniprogram/quotes/[id]/confirm
 * 客户确认报价单并上传签名
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { getMiniprogramUser } from '../../../auth-utils';



export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // P0 修复：添加 JWT 认证
    const user = await getMiniprogramUser(request);
    if (!user) {
      return apiError('未授权', 401);
    }

    const { id } = await context.params;
    const body = await request.json();
    const { signatureUrl } = body;

    if (!signatureUrl) {
      return apiError('签名URL不能为空', 400);
    }

    // P0 修复：添加 tenantId 过滤 + 状态校验
    // 先查询报价单，确认归属和状态
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

    // 更新报价单状态 (带 tenantId 二次防线)
    await db
      .update(quotes)
      .set({
        status: 'ACCEPTED',
        customerSignatureUrl: signatureUrl,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.id, id), eq(quotes.tenantId, user.tenantId)));

    return apiSuccess({ status: 'ACCEPTED' });
  } catch (error) {
    console.error('[POST /api/miniprogram/quotes/[id]/confirm] Error:', error);
    return apiError('确认报价失败', 500);
  }
}
