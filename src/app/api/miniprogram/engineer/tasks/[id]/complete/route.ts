import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks, installPhotos } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { getMiniprogramUser } from '../../../../auth-utils';



export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const { id: taskId } = await params;
        const body = await request.json();
        const { photos, signatureUrl, remark } = body;

        return await db.transaction(async (tx) => {
            // Verify Task ownership
            const task = await tx.query.installTasks.findFirst({
                where: and(
                    eq(installTasks.id, taskId),
                    eq(installTasks.tenantId, user.tenantId),
                    eq(installTasks.installerId, user.id)
                )
            });

            if (!task) {
                return apiError('Task not found or not assigned to you', 404);
            }

            // 1. Update Task Status
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

            // 2. Insert Photos
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

            return apiSuccess(null);
        });

    }
    catch (error) {
        console.error('Complete Task Error:', error);
        return apiError('Internal Error', 500);
    }
}

