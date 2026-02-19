'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { marketChannels } from '@/shared/api/schema';
import { eq, asc, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/services/audit-service';

// ============================================================
// 渠道管理 Actions
// ============================================================

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
        const categories = await db.query.marketChannels.findMany({
            where: eq(marketChannels.tenantId, session.user.tenantId),
            orderBy: [asc(marketChannels.name)],
        });
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

    // 权限检查
    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

    try {
        const result = await db.insert(marketChannels).values({
            tenantId: session.user.tenantId,
            name: data.name,
            code: data.code || data.name.toLowerCase().replace(/\s+/g, '_'),
            parentId: data.parentId,
            isActive: data.isActive,
        }).returning();

        // 记录审计日志
        // 记录审计日志
        if (result[0]) {
            await AuditService.log(db, {
                tableName: 'market_channels',
                recordId: result[0].id,
                action: 'CREATE',
                userId: session.user.id,
                tenantId: session.user.tenantId,
                newValues: result[0],
            });
        }

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

    // 权限检查
    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

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

        // 记录审计日志
        // 记录审计日志
        await AuditService.log(db, {
            tableName: 'market_channels',
            recordId: data.id,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId: session.user.tenantId,
            oldValues: existingChannel,
            newValues: { ...existingChannel, ...data },
            changedFields: data,
        });

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

    // 权限检查
    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

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

        // 检查是否存在子渠道 (R3-11)
        const childChannel = await db.query.marketChannels.findFirst({
            where: eq(marketChannels.parentId, data.id),
        });
        if (childChannel) {
            return { success: false, error: '该渠道下存在子渠道，无法删除' };
        }

        await db.delete(marketChannels)
            .where(and(
                eq(marketChannels.id, data.id),
                eq(marketChannels.tenantId, session.user.tenantId)
            ));

        // 记录审计日志
        // 记录审计日志
        await AuditService.log(db, {
            tableName: 'market_channels',
            recordId: data.id,
            action: 'DELETE',
            userId: session.user.id,
            tenantId: session.user.tenantId,
            oldValues: existingChannel,
        });

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

