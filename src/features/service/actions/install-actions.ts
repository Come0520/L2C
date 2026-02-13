'use server';

import { db } from '@/shared/api/db';
import { installTasks, installItems, users } from '@/shared/api/schema';
import { eq, and, desc, like, inArray } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper: Get Session
async function getSession() {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function getInstallTasks(params?: {
    status?: string;
    search?: string;
}) {
    try {
        const session = await getSession();
        const conditions = [eq(installTasks.tenantId, session.user.tenantId)];

        if (params?.status && params.status !== 'ALL') {
            // Ensure status matches the enum type or treat as string if DB driver allows
            conditions.push(eq(installTasks.status, params.status as 'PENDING_DISPATCH' | 'PENDING_ACCEPT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'));
        }

        if (params?.search) {
            // Search by customer or task no
            conditions.push(
                like(installTasks.taskNo, `%${params.search}%`)
                // or like(installTasks.customerName, ...) - Drizzle OR syntax needed if multiple
            );
        }

        const list = await db.query.installTasks.findMany({
            where: and(...conditions),
            orderBy: [desc(installTasks.createdAt)],
            with: {
                installer: { columns: { name: true, phone: true } },
                // customer: { columns: { name: true } } // customerName is denormalized in task? Yes.
            }
        });

        return { success: true, data: list };

    } catch (e) {
        return { success: false, error: 'Fetch failed' };
    }
}

export async function getInstallTaskDetail(id: string) {
    try {
        const session = await getSession();
        const task = await db.query.installTasks.findFirst({
            where: and(eq(installTasks.id, id), eq(installTasks.tenantId, session.user.tenantId)),
            with: {
                items: true,
                installer: { columns: { name: true, phone: true } }
            }
        });

        if (!task) return { success: false, error: 'Not found' };
        return { success: true, data: task };
    } catch (e) {
        return { success: false, error: 'Fetch Detail Error' };
    }
}

export async function getInstallers() {
    try {
        const session = await getSession();
        // Ideally filter by role. For MVP, fetch all users.
        const list = await db.query.users.findMany({
            where: eq(users.tenantId, session.user.tenantId),
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
