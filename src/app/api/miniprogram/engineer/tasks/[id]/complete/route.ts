import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks, installPhotos } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Helper: Get User Info
async function getUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.slice(7);
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, payload.userId as string),
            columns: { id: true, role: true, tenantId: true },
        });
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id: taskId } = await params;
        const body = await request.json();
        const { photos, signatureUrl, remark } = body;

        // Validation
        if (!photos || photos.length === 0) {
            return NextResponse.json({ success: false, error: '请上传现场照片' }, { status: 400 });
        }

        // Verify Task ownership
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.tenantId, user.tenantId),
                eq(installTasks.installerId, user.id)
            )
        });

        if (!task) {
            return NextResponse.json({ success: false, error: 'Task not found or not assigned to you' }, { status: 404 });
        }

        return await db.transaction(async (tx) => {
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

            return NextResponse.json({ success: true });
        });

    } catch (error) {
        console.error('Complete Task Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
