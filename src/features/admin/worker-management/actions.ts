'use server';

import { db } from '@/shared/api/db';
import { users, auditLogs } from '@/shared/api/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Session } from 'next-auth';

const updateWorkerSchema = z.object({
    id: z.string(),
    // skills: z.array(z.string()).optional(),
    // addressGeo: z.any().optional(),
    isActive: z.boolean().optional(),
    avatarUrl: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
});

/**
 * 获取师傅列表
 */
export async function getWorkers(params: { page: number; pageSize: number; search?: string }, session: Session) {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    const { page, pageSize, search } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [
        eq(users.tenantId, session.user.tenantId),
        eq(users.role, 'WORKER')
    ];

    if (search) {
        conditions.push(like(users.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const data = await db.query.users.findMany({
        where: whereClause,
        orderBy: [desc(users.createdAt)],
        limit: pageSize,
        offset: offset,
        columns: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
            // skills: true,
            // addressGeo: true,
            // workerRating: true,
            isActive: true,
            role: true,
            createdAt: true,
        }
    });

    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);

    return {
        data,
        total: Number(countResult?.count || 0)
    };
}

/**
 * 获取师傅详情
 */
export async function getWorkerById(id: string, session: Session) {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    const worker = await db.query.users.findFirst({
        where: and(
            eq(users.id, id),
            eq(users.tenantId, session.user.tenantId)
        )
    });

    if (!worker) throw new Error('未找到该师傅');
    return worker;
}

const updateWorkerActionInternal = createSafeAction(updateWorkerSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    const { id, ...updates } = data;

    const [updated] = await db.update(users)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(and(
            eq(users.id, id),
            eq(users.tenantId, session.user.tenantId)
        ))
        .returning();

    await db.insert(auditLogs).values({
        tenantId: session.user.tenantId,
        action: 'UPDATE_WORKER',
        tableName: 'users',
        recordId: id,
        userId: session.user.id,
        newValues: updates as Record<string, unknown>,
        createdAt: new Date(),
    });

    revalidatePath('/admin/settings/workers');
    return { success: true, data: updated };
});

export async function updateWorker(params: z.infer<typeof updateWorkerSchema>) {
    return updateWorkerActionInternal(params);
}
