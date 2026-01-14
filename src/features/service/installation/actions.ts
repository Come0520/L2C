'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { apStatements, apStatementItems, installTasks } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';

const confirmInstallationSchema = z.object({
    taskId: z.string(),
    actualLaborFee: z.number().positive(),
    adjustmentReason: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
});

export const getInstallTasks = async () => {
    return { success: true, data: [] };
};

export const getInstallTaskById = async (id: string) => {
    return { success: true, data: null };
};

export const createInstallTask = createSafeAction(z.object({
    id: z.string().optional(),
    data: z.any().optional()
}), async (data) => {
    revalidatePath('/service/installation');
    return { success: true, message: "Install task created (mock)" };
});

export const updateInstallResult = createSafeAction(z.object({
    id: z.string().optional(),
    data: z.any().optional()
}), async (data) => {
    revalidatePath('/service/installation');
    return { success: true, message: "Install result updated (mock)" };
});

export const dispatchInstallTask = createSafeAction(z.object({
    id: z.string().optional(),
    data: z.any().optional()
}), async (data) => {
    revalidatePath('/service/installation');
    return { success: true, message: "Install task dispatched (mock)" };
});

export const checkInInstallTask = createSafeAction(z.object({
    id: z.string().optional(),
    data: z.any().optional()
}), async () => {
    return { success: true, message: "Install task checked in (mock)" };
});

export const confirmInstallation = createSafeAction(confirmInstallationSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { taskId, actualLaborFee, adjustmentReason, rating } = data;

    return db.transaction(async (tx) => {
        const task = await tx.query.installTasks.findFirst({
            where: (installTasks, { eq }) => eq(installTasks.id, taskId),
        });

        if (!task) {
            return { success: false, error: 'Installation task not found' };
        }

        if (task.status !== 'PENDING_CONFIRM') {
            return { success: false, error: 'Task is not pending confirmation' };
        }

        const existingAp = await tx.query.apStatements.findFirst({
            where: (apStatements, { eq, and }) => 
                and(
                    eq(apStatements.tenantId, session.user.tenantId),
                    eq(apStatements.relatedOrderId, task.orderId)
                ),
        });

        if (existingAp) {
            return { success: false, error: 'AP statement already exists' };
        }

        const apStatement = await tx.insert(apStatements).values({
            tenantId: session.user.tenantId,
            apNo: `AP-${Date.now()}`,
            supplierId: task.assignedWorkerId,
            relatedOrderId: task.orderId,
            totalAmount: actualLaborFee * 100,
            status: 'PENDING',
        }).returning();

        await tx.insert(apStatementItems).values({
            apStatementId: apStatement[0].id,
            itemType: 'LABOR',
            description: adjustmentReason || 'Installation labor fee',
            quantity: 1,
            unitPrice: actualLaborFee * 100,
            amount: actualLaborFee * 100,
        });

        await tx.update(installTasks).set({
            status: 'COMPLETED',
            actualLaborFee: actualLaborFee.toString(),
            adjustmentReason,
            rating,
            confirmedAt: new Date(),
            confirmedBy: session.user.id,
        }).where((installTasks, { eq }) => eq(installTasks.id, taskId));

        revalidatePath('/service/installation');
        revalidatePath('/finance/ap');

        return { success: true, message: 'Installation confirmed successfully' };
    });
});

export const rejectInstallation = createSafeAction(z.object({
    id: z.string().optional(),
    data: z.any().optional()
}), async (data) => {
    revalidatePath('/service/installation');
    return { success: true, message: "Installation rejected (mock)" };
});

export const getRecommendedWorkers = async () => {
    return { success: true, data: [] };
};

export const assignInstallWorker = dispatchInstallTask;
export const completeInstallTask = confirmInstallation;
export const rejectInstallTask = rejectInstallation;
