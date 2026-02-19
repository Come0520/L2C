'use server';

import { db } from '@/shared/api/db';
import { channelCategories, channels } from '@/shared/api/schema/channels';
import { eq, and, asc, or, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { channelCategorySchema, type ChannelCategoryInput } from './schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/services/audit-service';
import { z } from 'zod';

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

    // P3 Fix: Add permission check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

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

    // P3 Fix: Add permission check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

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

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    const tenantId = session.user.tenantId;

    // P3 Fix: Add permission check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

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

    // 检查重复 (Name or Code)
    const existing = await db.query.channelCategories.findFirst({
        where: and(
            eq(channelCategories.tenantId, tenantId),
            or(
                eq(channelCategories.code, validated.code),
                eq(channelCategories.name, validated.name)
            )
        ),
        columns: { id: true, name: true, code: true }
    });

    if (existing) {
        if (existing.code === validated.code) throw new Error(`分类编码 ${validated.code} 已存在`);
        if (existing.name === validated.name) throw new Error(`分类名称 ${validated.name} 已存在`);
    }

    const [newCategory] = await db.insert(channelCategories).values({
        ...validated,
        tenantId,
    }).returning();

    // P1 Fix: Audit log
    await AuditService.log(db, {
        tableName: 'channel_categories',
        recordId: newCategory.id,
        action: 'CREATE',
        userId: session.user.id,
        tenantId,
        newValues: newCategory,
        details: { reason: 'Channel category creation' }
    });

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

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const tenantId = session.user.tenantId;

    // P2 Fix: Validate input using schema partial
    const validated = channelCategorySchema.partial().parse(input);

    const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.code !== undefined) updateData.code = validated.code;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder;

    // 检查重复 (如果修改了 Name 或 Code)
    if (validated.name !== undefined || validated.code !== undefined) {
        const checks = [];
        if (validated.code !== undefined) checks.push(eq(channelCategories.code, validated.code));
        if (validated.name !== undefined) checks.push(eq(channelCategories.name, validated.name));

        if (checks.length > 0) {
            const existing = await db.query.channelCategories.findFirst({
                where: and(
                    eq(channelCategories.tenantId, tenantId),
                    ne(channelCategories.id, id), // Exclude self
                    or(...checks)
                ),
                columns: { id: true, name: true, code: true }
            });

            if (existing) {
                if (validated.code !== undefined && existing.code === validated.code) throw new Error(`分类编码 ${validated.code} 已存在`);
                if (validated.name !== undefined && existing.name === validated.name) throw new Error(`分类名称 ${validated.name} 已存在`);
            }
        }
    }

    const [updated] = await db.update(channelCategories)
        .set(updateData)
        .where(and(
            eq(channelCategories.id, id),
            eq(channelCategories.tenantId, tenantId)
        ))
        .returning();

    // P1 Fix: Audit log
    if (updated) {
        await AuditService.log(db, {
            tableName: 'channel_categories',
            recordId: id,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId,
            newValues: updated,
            details: { reason: 'Channel category update', updatedFields: Object.keys(updateData) }
        });
    }

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

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

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

    // P1 Fix: Audit log (Fetch before delete)
    const category = await db.query.channelCategories.findFirst({
        where: and(eq(channelCategories.id, id), eq(channelCategories.tenantId, tenantId))
    });

    await db.delete(channelCategories)
        .where(and(
            eq(channelCategories.id, id),
            eq(channelCategories.tenantId, tenantId)
        ));

    if (category) {
        await AuditService.log(db, {
            tableName: 'channel_categories',
            recordId: id,
            action: 'DELETE',
            userId: session.user.id,
            tenantId,
            oldValues: category,
            details: { reason: 'Channel category deletion' }
        });
    }

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

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    const tenantId = session.user.tenantId;

    const current = await db.query.channelCategories.findFirst({
        where: and(eq(channelCategories.id, id), eq(channelCategories.tenantId, tenantId)),
        columns: { isActive: true }
    });

    if (!current) throw new Error('Category not found');

    const newActiveState = !current.isActive;

    // If currently active, we are disabling it. Check usage.
    if (current.isActive) {
        const activeChannelsCount = await db.$count(channels, and(
            eq(channels.categoryId, id),
            eq(channels.status, 'ACTIVE'),
            eq(channels.tenantId, tenantId)
        ));

        if (activeChannelsCount > 0) {
            throw new Error(`无法禁用该类型：存在 ${activeChannelsCount} 个关联的活跃渠道`);
        }
    }

    const [updated] = await db.update(channelCategories)
        .set({
            isActive: newActiveState,
            updatedAt: new Date()
        })
        .where(and(
            eq(channelCategories.id, id),
            eq(channelCategories.tenantId, tenantId)
        ))
        .returning();

    if (!updated) {
        throw new Error('渠道类型不存在');
    }

    // P1 Fix: Audit log
    await AuditService.log(db, {
        tableName: 'channel_categories',
        recordId: id,
        action: 'UPDATE',
        userId: session.user.id,
        tenantId,
        newValues: { isActive: newActiveState },
        details: { reason: 'Toggle category active status' }
    });

    revalidatePath('/settings/channels');
    return updated;
}
