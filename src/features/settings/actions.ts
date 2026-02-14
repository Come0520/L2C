'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const mockActionSchema = z.object({
    id: z.string().optional(),
    data: z.any().optional()
});

const updateUserSettingsAction = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings');
    return { success: true, message: "Settings updated in recovery mode" };
});

export async function updateUserSettings(data: z.infer<typeof mockActionSchema>) {
    return updateUserSettingsAction(data);
}

const createUserAction = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings/users');
    return { success: true, message: "User created in recovery mode" };
});

// export async function createUser(data: z.infer<typeof mockActionSchema>) {
//     return createUserAction(data);
// }

// const updateUserAction = createSafeAction(mockActionSchema, async (data) => {
//     revalidatePath('/settings/users');
//     return { success: true, message: "User updated in recovery mode" };
// });

// export async function updateUser(data: z.infer<typeof mockActionSchema>) {
//     return updateUserAction(data);
// }

// const deleteUserAction = createSafeAction(mockActionSchema, async (data) => {
//     revalidatePath('/settings/users');
//     return { success: true, message: "User deleted in recovery mode" };
// });

// export async function deleteUser(data: z.infer<typeof mockActionSchema>) {
//     return deleteUserAction(data);
// }

const updateTenantProfileAction = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings/general');
    return { success: true, message: "Tenant profile updated in recovery mode" };
});

export async function updateTenantProfile(data: z.infer<typeof mockActionSchema>) {
    return updateTenantProfileAction(data);
}

// --- 渠道管理 Actions ---

import { db } from '@/shared/api/db';
import { marketChannels } from '@/shared/api/schema';
import { eq, asc, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

/**
 * 获取所有渠道
 */
export async function getChannels() {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: '未授权', data: [] };

    try {
        const channels = await db.query.marketChannels.findMany({
            where: eq(marketChannels.tenantId, session.user.tenantId),
            orderBy: [asc(marketChannels.name)],
            with: {
                parent: true,
                children: true,
            }
        });
        return { success: true, data: channels };
    } catch (_error) {
        console.error('获取渠道列表失败:', _error);
        return { success: false, error: '获取渠道列表失败', data: [] };
    }
}

/**
 * 获取渠道分类（顶级渠道）
 */
export async function getChannelCategories() {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: '未授权', data: [] };

    try {
        // 获取顶级渠道（parentId 为空的）
        const categories = await db.query.marketChannels.findMany({
            where: eq(marketChannels.tenantId, session.user.tenantId),
            orderBy: [asc(marketChannels.name)],
        });
        // 过滤出顶级分类
        const topLevelCategories = categories.filter(c => !c.parentId);
        return { success: true, data: topLevelCategories };
    } catch (_error) {
        console.error('获取渠道分类失败:', _error);
        return { success: false, error: '获取渠道分类失败', data: [] };
    }
}

const channelSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, '渠道名称必填'),
    code: z.string().optional(),
    parentId: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
});

/**
 * 创建渠道
 */
const createChannelAction = createSafeAction(channelSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        await db.insert(marketChannels).values({
            tenantId: session.user.tenantId,
            name: data.name,
            code: data.code || data.name.toLowerCase().replace(/\s+/g, '_'),
            parentId: data.parentId,
            isActive: data.isActive,
        });

        revalidatePath('/settings/channels');
        return { success: true, message: '渠道创建成功' };
    } catch (_error) {
        console.error('创建渠道失败:', _error);
        return { success: false, error: '创建渠道失败' };
    }
});

export async function createChannel(data: z.infer<typeof channelSchema>) {
    return createChannelAction(data);
}

/**
 * 更新渠道
 */
const updateChannelAction = createSafeAction(channelSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId || !data.id) return { success: false, error: '未授权或缺少 ID' };

    try {
        // 安全检查：验证渠道属于当前租户
        const existingChannel = await db.query.marketChannels.findFirst({
            where: and(
                eq(marketChannels.id, data.id),
                eq(marketChannels.tenantId, session.user.tenantId)
            ),
        });
        if (!existingChannel) {
            return { success: false, error: '渠道不存在或无权操作' };
        }

        await db.update(marketChannels)
            .set({
                name: data.name,
                code: data.code,
                parentId: data.parentId,
                isActive: data.isActive,
                updatedAt: new Date(),
            })
            .where(and(
                eq(marketChannels.id, data.id),
                eq(marketChannels.tenantId, session.user.tenantId)
            ));

        revalidatePath('/settings/channels');
        return { success: true, message: '渠道更新成功' };
    } catch (_error) {
        console.error('更新渠道失败:', _error);
        return { success: false, error: '更新渠道失败' };
    }
});

export async function updateChannel(data: z.infer<typeof channelSchema>) {
    return updateChannelAction(data);
}

/**
 * 删除渠道
 */
const deleteChannelAction = createSafeAction(z.object({ id: z.string() }), async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        // 安全检查：验证渠道属于当前租户
        const existingChannel = await db.query.marketChannels.findFirst({
            where: and(
                eq(marketChannels.id, data.id),
                eq(marketChannels.tenantId, session.user.tenantId)
            ),
        });
        if (!existingChannel) {
            return { success: false, error: '渠道不存在或无权操作' };
        }

        await db.delete(marketChannels)
            .where(and(
                eq(marketChannels.id, data.id),
                eq(marketChannels.tenantId, session.user.tenantId)
            ));

        revalidatePath('/settings/channels');
        return { success: true, message: '渠道删除成功' };
    } catch (_error) {
        console.error('删除渠道失败:', _error);
        return { success: false, error: '删除渠道失败' };
    }
});

export async function deleteChannel(data: { id: string }) {
    return deleteChannelAction(data);
}

