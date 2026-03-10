/**
 * 客户安装验收 API
 *
 * POST /api/miniprogram/orders/[id]/install-accept
 *
 * 业务场景：客户在小程序中查看到"待验收"的安装任务，
 *           客户可以上传电子签名确认安装合格。
 *
 * @param id 订单 ID（通过 orderId 关联到 install_tasks 表）
 * @body signatureUrl: 电子签名 OSS 路径（必填）
 * @body photoUrls: 验收照片 OSS 路径数组（选填）
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks, installPhotos } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiNotFound,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../../auth-utils';
import { AuditService } from '@/shared/services/audit-service';

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      if (!user || (!user.tenantId && user.role !== 'SUPER_ADMIN')) {
        return apiUnauthorized('未授权');
      }

      const { id: orderId } = params;
      const { signatureUrl, photoUrls } = await request.json();

      if (!signatureUrl) {
        return apiBadRequest('请必须提供本人签名');
      }

      // 通过 orderId 查找对应的安装任务（取最新的待确认任务）
      const task = await db.query.installTasks.findFirst({
        where: and(
          eq(installTasks.orderId, orderId),
          eq(installTasks.tenantId, user.tenantId as string)
        ),
        columns: {
          id: true,
          status: true,
          customerSignatureUrl: true,
        },
      });

      if (!task) {
        return apiNotFound('找不到对应的安装任务');
      }

      // 状态检查：只有 PENDING_CONFIRM（待验收）状态允许客户签名
      if (task.status !== 'PENDING_CONFIRM') {
        return apiBadRequest(
          `当前安装任务状态（${task.status}）不允许签名验收，请联系安装师确认完工后再操作`
        );
      }

      // 已有签名则不允许重复签署（防止覆盖）
      if (task.customerSignatureUrl) {
        return apiBadRequest('客户签名已存在，请勿重复签署');
      }

      // 写入签名 URL 及签署时间到 install_tasks 表
      await db
        .update(installTasks)
        .set({
          customerSignatureUrl: signatureUrl,
          signedAt: new Date(),
        })
        .where(
          and(eq(installTasks.id, task.id), eq(installTasks.tenantId, user.tenantId as string))
        );

      // 若有验收照片，批量插入 install_photos 表
      if (Array.isArray(photoUrls) && photoUrls.length > 0) {
        const photoRecords = photoUrls.map((url: string) => ({
          tenantId: user.tenantId as string,
          installTaskId: task.id,
          photoType: 'AFTER' as const, // 验收阶段的照片归类为 AFTER
          photoUrl: url,
          remark: '客户验收照片',
          createdBy: user.id,
        }));
        await db.insert(installPhotos).values(photoRecords);
      }

      // 审计日志留痕
      await AuditService.log(db, {
        tableName: 'install_tasks',
        recordId: task.id,
        action: 'UPDATE',
        userId: user.id,
        tenantId: user.tenantId as string,
        details: {
          action: 'CUSTOMER_ACCEPTANCE_SIGNATURE',
          signatureUrl,
          photoCount: Array.isArray(photoUrls) ? photoUrls.length : 0,
          orderId,
        },
      });

      logger.info('[InstallAccept] 客户验收签名提交成功', {
        orderId,
        taskId: task.id,
        userId: user.id,
      });

      return apiSuccess({ success: true, taskId: task.id, orderId });
    } catch (error) {
      logger.error('[InstallAccept] 客户验收异常', {
        route: `orders/${params.id}/install-accept`,
        error,
      });
      return apiServerError('验收提交失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN', 'CUSTOMER']
);
