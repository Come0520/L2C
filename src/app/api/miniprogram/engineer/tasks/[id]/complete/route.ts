import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks, installPhotos } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../../../auth-utils';
import { AuditService } from '@/shared/services/audit-service';



export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
        }

        const { id: taskId } = await params;
        const body = await request.json();
        const { photos, signatureUrl, remark } = body;

        return await db.transaction(async (tx) => {
            // 验证任务归属
            const task = await tx.query.installTasks.findFirst({
                where: and(
                    eq(installTasks.id, taskId),
                    eq(installTasks.tenantId, user.tenantId),
                    eq(installTasks.installerId, user.id)
                )
            });

            if (!task) {
                return apiError('任务不存在或未指派给您', 404);
            }

            // 1. 更新任务状态
            await tx.update(installTasks)
                .set({
                    status: 'COMPLETED',
                    customerSignatureUrl: signatureUrl,
                    remark: remark,
                    actualEndAt: new Date(),
                    completedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(installTasks.id, taskId));

            // 2. 插入照片
            if (photos && photos.length > 0) {
                const photoRecords = photos.map((url: string) => ({
                    tenantId: user.tenantId,
                    installTaskId: taskId,
                    photoType: 'INSTALLATION_RESULT' as const,
                    photoUrl: url,
                    createdAt: new Date()
                }));
                await tx.insert(installPhotos).values(photoRecords);
            }

            // 3. 审计日志
            await AuditService.log(tx, {
                tableName: 'install_tasks',
                recordId: taskId,
                action: 'COMPLETE',
                userId: user.id,
                tenantId: user.tenantId,
                details: { photoCount: photos?.length || 0 }
            });

            return apiSuccess(null);
        });

    } catch (error) {
        logger.error('[InstallTask] 完成任务失败', { route: 'engineer/tasks/complete', error });
        return apiError('处理完成任务请求时发生错误', 500);
    }
}

