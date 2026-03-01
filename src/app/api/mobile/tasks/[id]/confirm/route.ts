/**
 * 客户侧 — 签字确认完工 API
 *
 * POST /api/mobile/tasks/[id]/confirm
 * 客户查看完工照片后手写签字确认验收
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { createLogger } from '@/shared/lib/logger';
import { authenticateMobile } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';
import { withRateLimit, getRateLimitKey } from '@/shared/middleware/rate-limiter';
import { z } from 'zod';

const log = createLogger('mobile:tasks:confirm');

/**
 * 输入验证 Schema
 */
const ConfirmSchema = z.object({
  signatureUrl: z.string().min(1, '签名URL不能为空').url('签名URL格式无效'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function confirmHandler(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) return authResult.response;
    const { session } = authResult;

    const { id: taskId } = await params;

    // 2. Zod 输入验证
    let validatedData;
    try {
      const body = await request.json();
      const result = ConfirmSchema.safeParse(body);
      if (!result.success) {
        return apiError(result.error.issues[0].message, 400);
      }
      validatedData = result.data;
    } catch {
      return apiError('请求体格式错误', 400);
    }

    const { signatureUrl } = validatedData;

    // 3. 查询任务（含租户隔离）
    const task = await db.query.installTasks.findFirst({
      where: and(eq(installTasks.id, taskId), eq(installTasks.tenantId, session.tenantId)),
      columns: {
        id: true,
        status: true,
        customerSignatureUrl: true,
      },
    });

    if (!task) {
      return apiNotFound('任务不存在');
    }

    // 4. 状态校验：只允许 PENDING_CONFIRM 或 COMPLETED（未签字）状态确认
    const allowedStatuses = ['PENDING_CONFIRM', 'COMPLETED'];
    if (!allowedStatuses.includes(task.status)) {
      return apiError(`当前状态 ${task.status} 不允许签字确认`, 400);
    }

    // 防止重复签字
    if (task.customerSignatureUrl) {
      return apiError('该任务已完成签字确认，请勿重复操作', 400);
    }

    // 5. 更新签字信息
    const now = new Date();
    await db
      .update(installTasks)
      .set({
        customerSignatureUrl: signatureUrl,
        signedAt: now,
        confirmedBy: session.userId,
        confirmedAt: now,
        status: 'COMPLETED',
        updatedAt: now,
      })
      .where(eq(installTasks.id, taskId));

    // 6. 审计日志
    await AuditService.log(db, {
      tableName: 'install_tasks',
      recordId: taskId,
      action: 'CUSTOMER_CONFIRM_SIGNATURE',
      userId: session.userId,
      tenantId: session.tenantId,
      details: { signatureUrl },
      traceId: session.traceId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    });

    log.info('客户签字确认成功', { taskId, userId: session.userId });

    return apiSuccess({ taskId, status: 'COMPLETED', signedAt: now.toISOString() }, '签字确认成功');
  } catch (error) {
    log.error(
      '客户签字确认失败',
      { error: error instanceof Error ? error.message : String(error) },
      error
    );
    return apiError('签字确认失败，请稍后重试', 500);
  }
}

// 应用频率限制：每分钟最多 10 次确认
export const POST = withRateLimit(
  confirmHandler,
  { windowMs: 60 * 1000, maxAttempts: 10 },
  getRateLimitKey('tasks:customer-confirm')
);
