import { db } from '@/shared/api/db';
import { installTasks, installItems, users } from '@/shared/api/schema';
import { eq, and, desc, like, inArray } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { PERMISSIONS } from '@/shared/config/permissions';

// Helper: Get Session
async function getSession() {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function getInstallTasks(filters?: { status?: string; search?: string }) {
    try {
        const session = await getSession();
        const { status, search } = filters || {};

        const list = await db.query.installTasks.findMany({
            where: and(
                eq(installTasks.tenantId, session.user.tenantId),
                search ? like(installTasks.taskNo, `%${search}%`) : undefined,
                status && status !== 'ALL' ? eq(installTasks.status, status as any) : undefined
            ),
            with: {
                installer: true,
                items: true
            },
            orderBy: [desc(installTasks.createdAt)]
        });
        return { success: true, data: list };
    } catch (e) {
        return { success: false, data: [] };
    }
}

export async function getInstallers() {
    try {
        const session = await getSession();
        // P0-4 Fix: Filter by role WORKER/INSTALLER
        const list = await db.query.users.findMany({
            where: and(
                eq(users.tenantId, session.user.tenantId),
                inArray(users.role, ['WORKER', 'INSTALLER']) // Assuming roles
            ),
            columns: { id: true, name: true, role: true }
        });
        return { success: true, data: list };
    } catch {
        return { success: false, data: [] };
    }
}

export async function dispatchInstallTask(data: {
    taskId: string;
    installerId: string;
    scheduledDate: string; // ISO string
    scheduledTimeSlot: string;
}) {
    try {
        const session = await getSession();
        // P0-3 Fix: Add permission check
        await checkPermission(session, PERMISSIONS.INSTALL.MANAGE);

        const { taskId, installerId, scheduledDate, scheduledTimeSlot } = data;

        await db.update(installTasks)
            .set({
                installerId,
                scheduledDate: new Date(scheduledDate),
                scheduledTimeSlot,
                status: 'PENDING_ACCEPT', // Or PENDING_START if no accept flow
                dispatcherId: session.user.id,
                assignedAt: new Date(),
                updatedAt: new Date()
            })
            .where(and(eq(installTasks.id, taskId), eq(installTasks.tenantId, session.user.tenantId)));

        revalidatePath('/projects');
        revalidatePath(`/projects/${taskId}`);
        return { success: true };

    } catch (e) {
        return { success: false, error: 'Dispatch Failed' };
    }
}
