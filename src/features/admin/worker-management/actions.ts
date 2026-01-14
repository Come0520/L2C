'use server';

import { db } from '@/shared/api/db';
import { users, systemLogs } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions'; // Assuming ADMIN permissions exist
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// ==================== Schemas ====================

const updateWorkerSkillsSchema = z.object({
    userId: z.string().uuid(),
    skills: z.array(z.object({
        category: z.string(), // e.g., 'CURTAIN'
        capabilities: z.array(z.string()), // e.g., ['MEASURE', 'INSTALL']
        level: z.number().optional(), // 1-5
    })),
});

const updateWorkerAddressSchema = z.object({
    userId: z.string().uuid(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
});

const getWorkersSchema = z.object({
    page: z.number().default(1),
    pageSize: z.number().default(10),
    search: z.string().optional(),
    skill: z.string().optional(), // Filter by category
});

const getWorkerByIdSchema = z.object({
    userId: z.string().uuid(),
});

// ==================== Actions ====================

/**
 * 更新师傅技能标�?
 */
export const updateWorkerSkills = createSafeAction(updateWorkerSkillsSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    await db.transaction(async (tx) => {
        await tx.update(users)
            .set({
                skills: data.skills,
                updatedAt: new Date()
            })
            .where(eq(users.id, data.userId));

        await tx.insert(systemLogs).values({
            tenantId: session.user.tenantId!,
            module: 'USER_MANAGEMENT',
            action: 'UPDATE_SKILLS',
            entityId: data.userId,
            operatorId: session.user.id!,
            details: { skills: data.skills }
        });
    });

    revalidatePath('/admin/workers');
    return { success: true };
});

/**
 * 更新师傅常驻地址 (用于距离计算)
 */
export const updateWorkerAddress = createSafeAction(updateWorkerAddressSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    const addressGeo = {
        address: data.address,
        lat: data.lat,
        lng: data.lng
    };

    await db.transaction(async (tx) => {
        await tx.update(users)
            .set({
                addressGeo: addressGeo,
                updatedAt: new Date()
            })
            .where(eq(users.id, data.userId));

        await tx.insert(systemLogs).values({
            tenantId: session.user.tenantId!,
            module: 'USER_MANAGEMENT',
            action: 'UPDATE_ADDRESS',
            entityId: data.userId,
            operatorId: session.user.id!,
            details: { addressGeo }
        });
    });

    revalidatePath('/admin/workers');
    revalidatePath('/admin/workers');
    return { success: true };
});

/**
 * 获取师傅列表
 */
export const getWorkers = createSafeAction(getWorkersSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    const offset = (data.page - 1) * data.pageSize;
    const conditions = [
        eq(users.tenantId, session.user.tenantId),
        eq(users.isActive, true)
        // Add role filter if needed, e.g. eq(users.role, 'WORKER')
    ];

    if (data.search) {
        conditions.push(and(
            eq(users.name, data.search) // Simple exact match for now, or use ilike
            // sql`(${users.name} ILIKE ${`%${data.search}%`} OR ${users.phone} ILIKE ${`%${data.search}%`})`
        ));
    }

    // Skill filtering would need JSONB query, skipped for MVP or done in memory if small list

    // Using simple query for now
    const result = await db.query.users.findMany({
        where: and(...conditions)!, // Force non-null as we have default conditions
        limit: data.pageSize,
        offset: offset,
        columns: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
            skills: true,
            addressGeo: true,
            workerRating: true,
            isActive: true
        }
    });

    // TODO: Total count query

    return { success: true, data: result };
});

/**
 * 获取师傅详情
 */
export const getWorkerById = createSafeAction(getWorkerByIdSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);

    const worker = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
        columns: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
            skills: true,
            addressGeo: true,
            workerRating: true,
            isActive: true,
            role: true
        }
    });

    if (!worker) return { success: false, error: '未找到该师傅' };
    return { success: true, data: worker };
});
