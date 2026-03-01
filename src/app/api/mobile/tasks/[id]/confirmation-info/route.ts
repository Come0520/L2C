/**
 * 客户侧 — 获取完工确认信息 API
 *
 * GET /api/mobile/tasks/[id]/confirmation-info
 * 客户通过分享链接打开页面时加载任务详情（含完工照片、备注等）
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks, installPhotos } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { createLogger } from '@/shared/lib/logger';
import { authenticateMobile } from '@/shared/middleware/mobile-auth';

const log = createLogger('mobile:tasks:confirmation-info');

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 认证（客户也需要登录态）
    const authResult = await authenticateMobile(request);
    if (!authResult.success) return authResult.response;

    const { session } = authResult;
    const { id: taskId } = await params;

    // 查询安装任务
    const task = await db.query.installTasks.findFirst({
      where: eq(installTasks.id, taskId),
      columns: {
        id: true,
        taskNo: true,
        status: true,
        customerName: true,
        customerPhone: true,
        address: true,
        remark: true,
        customerSignatureUrl: true,
        signedAt: true,
        completedAt: true,
        scheduledDate: true,
        tenantId: true,
        customerId: true,
      },
    });

    if (!task) {
      return apiNotFound('任务不存在');
    }

    // 租户隔离校验
    if (task.tenantId !== session.tenantId) {
      return apiNotFound('任务不存在');
    }

    // 查询完工照片
    const photos = await db
      .select({
        id: installPhotos.id,
        photoUrl: installPhotos.photoUrl,
        photoType: installPhotos.photoType,
        remark: installPhotos.remark,
        createdAt: installPhotos.createdAt,
      })
      .from(installPhotos)
      .where(eq(installPhotos.installTaskId, taskId));

    // 组装返回数据
    const result = {
      id: task.id,
      taskNo: task.taskNo,
      status: task.status,
      customerName: task.customerName,
      customerPhone: task.customerPhone,
      customerAddress: task.address,
      remark: task.remark,
      completedAt: task.completedAt?.toISOString() || null,
      scheduledDate: task.scheduledDate?.toISOString() || null,
      customerSignatureUrl: task.customerSignatureUrl,
      signedAt: task.signedAt?.toISOString() || null,
      // 将照片转为简易 URL 数组（前端直接渲染）
      photos: photos.map((p) => p.photoUrl),
      photoDetails: photos,
    };

    return apiSuccess(result);
  } catch (error) {
    log.error(
      '获取完工确认信息失败',
      { error: error instanceof Error ? error.message : String(error) },
      error
    );
    return apiError('加载失败', 500);
  }
}
