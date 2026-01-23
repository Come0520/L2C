'use server';

import { db } from '@/shared/api/db';
import { channelCategories, channels } from '@/shared/api/schema/channels';
import { eq, and, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { channelCategorySchema, type ChannelCategoryInput } from './schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

// ==================== 渠道类型 CRUD Actions ====================

/**
 * 获取所有渠道类型
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getChannelCategories() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const tenantId = session.user.tenantId;

    return await db.query.channelCategories.findMany({
        where: eq(channelCategories.tenantId, tenantId),
        orderBy: [asc(channelCategories.sortOrder), asc(channelCategories.createdAt)],
    });
}

/**
 * 获取启用的渠道类型（用于下拉选择）
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getActiveChannelCategories() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const tenantId = session.user.tenantId;

    return await db.query.channelCategories.findMany({
        where: and(
            eq(channelCategories.tenantId, tenantId),
            eq(channelCategories.isActive, true)
        ),
        orderBy: [asc(channelCategories.sortOrder)],
    });
}

/**
 * 根据 ID 获取渠道类型
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getChannelCategoryById(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const tenantId = session.user.tenantId;

    return await db.query.channelCategories.findFirst({
        where: and(
            eq(channelCategories.id, id),
            eq(channelCategories.tenantId, tenantId)
        ),
    });
}

/**
 * 创建渠道类型
 * 
 * 安全检查：需要 SETTINGS.MANAGE 权限
 */
export async function createChannelCategory(input: ChannelCategoryInput) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const tenantId = session.user.tenantId;
    const validated = channelCategorySchema.parse(input);

    const [newCategory] = await db.insert(channelCategories).values({
        ...validated,
        tenantId,
    }).returning();

    revalidatePath('/settings/channels');
    return newCategory;
}

/**
 * 更新渠道类型
 * 
 * 安全检查：需要 SETTINGS.MANAGE 权限
 */
export async function updateChannelCategory(
    id: string,
    input: Partial<ChannelCategoryInput>
) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const tenantId = session.user.tenantId;

    const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

    const [updated] = await db.update(channelCategories)
        .set(updateData)
        .where(and(
            eq(channelCategories.id, id),
            eq(channelCategories.tenantId, tenantId)
        ))
        .returning();

    revalidatePath('/settings/channels');
    return updated;
}

/**
 * 删除渠道类型
 * 
 * 安全检查：需要 SETTINGS.MANAGE 权限
 */
export async function deleteChannelCategory(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const tenantId = session.user.tenantId;

    // 检查是否有渠道正在使用该类型
    const hasChannels = await db.query.channels.findFirst({
        where: and(
            eq(channels.categoryId, id),
            eq(channels.tenantId, tenantId)
        )
    });

    if (hasChannels) {
        throw new Error('该类型下存在关联渠道，无法删除');
    }
    await db.delete(channelCategories)
        .where(and(
            eq(channelCategories.id, id),
            eq(channelCategories.tenantId, tenantId)
        ));

    revalidatePath('/settings/channels');
}

/**
 * 切换渠道类型启用状态
 * 
 * 安全检查：需要 SETTINGS.MANAGE 权限
 */
export async function toggleChannelCategoryActive(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const category = await getChannelCategoryById(id);
    if (!category) {
        throw new Error('渠道类型不存在');
    }

    return await updateChannelCategory(id, { isActive: !category.isActive });
}
