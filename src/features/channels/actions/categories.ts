'use server';

import { db } from '@/shared/api/db';
import { channelCategories, channels } from '@/shared/api/schema/channels';
import { eq, and, asc, or, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { channelCategorySchema } from './schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/services/audit-service';
import { z } from 'zod';

// ==================== 渠道类型 CRUD Actions ====================

/**
 * 分页获取渠道分类列表
 * 
 * 获取系统配置的渠道分类分页列表。支持可选的类别名称或状态筛选。
 *
 * @param {any} params - 结构化查询参数，支持 page, limit, name, isActive
 * @returns {Promise<{success: boolean, data: any[], total: number, error?: string}>} 带有总数的分类列表对象
 */
export async function getChannelCategories(_params?: {
    page?: number;
    limit?: number;
    name?: string;
    isActive?: boolean;
}) {
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
 * 获取所有启用的渠道分类
 * 
 * 供下拉框、表单选择等场景使用的地方，获取当前处于激活状态的所有渠道分类。
 * 
 * @returns {Promise<{success: boolean, data: any[], error?: string}>} 启用状态的分类数组
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
 * 根据ID获取特定渠道分类名细
 * 
 * @param {string} id - 要查询的目标渠道分类ID
 * @returns {Promise<{success: boolean, data: any, error?: string}>} 包含单条分类详情的实体数据
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
 * 创建渠道分类
 * 
 * 用于新增针对渠道的管理分类标签，创建时进行名称唯一性校验并生成系统日志。
 * 
 * @param {z.infer<typeof channelCategorySchema>} input - 创建渠道分类所需各项表单输入
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} 处理结果
 */
export async function createChannelCategory(input: z.infer<typeof channelCategorySchema>) {
    console.log('[channels] 开始创建渠道分类:', input);
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
 * 更新现有渠道分类
 * 
 * 对指定 ID 的渠道分类执行更名、属性修改等操作，同时会核实名称的唯一性限制（除去自身），
 * 同时产生操作审计日志。
 * 
 * @param {string} id - 更新目标分类的 UUID
 * @param {z.infer<typeof channelCategorySchema>} input - 更新字段载荷
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} 更新事务结果
 */
export async function updateChannelCategory(id: string, input: z.infer<typeof channelCategorySchema>) {
    console.log('[channels] 开始更新渠道分类:', { id, updates: input });
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
 * 删除特定渠道分类
 * 
 * 如果目标分类下尚未关联任何实质性的渠道实例，则允许进行硬删除处理，否则触发软保护机制报错。
 * 操作伴随着一条审计记录。
 * 
 * @param {string} id - 被硬删除操作指定的分类ID
 * @returns {Promise<{success: boolean, error?: string}>} 处理反馈信息
 */
export async function deleteChannelCategory(id: string) {
    console.log('[channels] 开始删除渠道分类:', { id });
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
 * 切换某个特定渠道分类的激活/停用状态
 * 
 * @param {string} id - 被控制分类对象的唯一编号
 * @param {boolean} isActive - 即将设定的在线状态预设值
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function toggleChannelCategoryActive(id: string, isActive: boolean) {
    console.log('[channels] 切换分类激活状态:', { id, isActive });
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
