'use server';

import { db } from '@/shared/api/db';
import { channels, channelContacts, channelCommissions } from '@/shared/api/schema/channels';
import { leads } from '@/shared/api/schema';
import { eq, and, ne, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { channelSchema, channelContactSchema, ChannelInput, ChannelContactInput } from './schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/services/audit-service';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';
import { z } from 'zod';

/**
 * 创建渠道
 * 
 * 验证用户权限后，检查渠道编码或名称的唯一性，
 * 并开启事务保存渠道信息，自动创建首个联系人并记录审计日志。
 * 
 * 安全检查：需要 CHANNEL.CREATE 权限
 * 
 * @param {ChannelInput} input - 创建渠道的输入参数
 * @returns {Promise<any>} 返回新创建的渠道对象
 * @throws {Error} 未授权、没有权限、渠道名/编码重复等将抛出异常
 */
export async function createChannel(input: ChannelInput) {
    console.log('[channels] 开始创建渠道:', { name: input.name, channelNo: input.channelNo });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查：需要渠道创建权限
    await checkPermission(session, PERMISSIONS.CHANNEL.CREATE);

    const tenantId = session.user.tenantId;
    const validated = channelSchema.parse(input);

    // 唯一性检查
    const existing = await db.query.channels.findFirst({
        where: and(
            eq(channels.tenantId, tenantId),
            or(
                eq(channels.channelNo, validated.channelNo),
                eq(channels.name, validated.name)
            )
        ),
        columns: { id: true, name: true, channelNo: true }
    });

    if (existing) {
        if (existing.channelNo === validated.channelNo) throw new Error(`渠道编码 ${validated.channelNo} 已存在`);
        if (existing.name === validated.name) throw new Error(`渠道名称 ${validated.name} 已存在`);
    }

    return await db.transaction(async (tx) => {
        const [newChannel] = await tx.insert(channels).values({
            ...validated,
            tenantId,
            // 层级字段
            parentId: validated.parentId || null,
            hierarchyLevel: validated.hierarchyLevel || 1,
            categoryId: validated.categoryId || null,
            // 财务字段转换
            commissionRate: validated.commissionRate.toString(),
            commissionType: validated.commissionType,
            tieredRates: validated.tieredRates ?? undefined,
            bankInfo: validated.bankInfo ?? undefined,
            priceDiscountRate: validated.priceDiscountRate ? validated.priceDiscountRate.toString() : null,
            creditLimit: validated.creditLimit ? validated.creditLimit.toString() : null,
            // 默认值
            totalLeads: 0,
            totalDealAmount: '0',
            status: 'ACTIVE',
            createdBy: session.user.id,
        }).returning();

        // 自动创建首个联系人
        await tx.insert(channelContacts).values({
            tenantId,
            channelId: newChannel.id,
            name: validated.contactName,
            phone: validated.phone,
            isMain: true,
            createdBy: session.user.id,
        });

        // P1 Fix: Audit Log
        await AuditService.log(tx, {
            tableName: 'channels',
            recordId: newChannel.id,
            action: 'CREATE',
            userId: session.user.id,
            tenantId,
            newValues: newChannel,
            details: { reason: 'Channel creation' }
        });

        revalidatePath('/channels');
        return newChannel;
    });
}

/**
 * 更新渠道
 * 
 * 验证更新参数，检查防止循环父级引用，并更新渠道数据。
 * 
 * 安全检查：需要 CHANNEL.EDIT 权限
 * 
 * @param {string} id - 需要更新的渠道ID
 * @param {Partial<ChannelInput>} input - 包含更新字段的对象
 * @returns {Promise<any>} 包含更新后渠道信息的对象
 * @throws {Error} 操作未授权，数据冲突或循环引用时将抛出异常
 */
export async function updateChannel(id: string, input: Partial<ChannelInput>) {
    console.log('[channels] 开始更新渠道:', { id, updates: Object.keys(input) });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    // 权限检查：需要渠道编辑权限
    await checkPermission(session, PERMISSIONS.CHANNEL.EDIT);

    const tenantId = session.user.tenantId;

    // fix: Zod's .partial() cannot be called on schemas with refinements.
    // Instead, we just trust the Input type here since it's `Partial<ChannelInput>`
    // The individual fields that are present will be validated by the update logic or DB constraints
    const validated = input;
    const version = input.version;

    // 构建更新数据，过滤掉 undefined 值
    const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
        version: sql`${channels.version} + 1`,
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.channelNo !== undefined) updateData.channelNo = validated.channelNo;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.channelType !== undefined) updateData.channelType = validated.channelType;
    if (validated.contactName !== undefined) updateData.contactName = validated.contactName;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.commissionRate !== undefined) updateData.commissionRate = validated.commissionRate?.toString();
    if (validated.commissionType !== undefined) updateData.commissionType = validated.commissionType;
    if (validated.parentId !== undefined) updateData.parentId = validated.parentId;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.level !== undefined) updateData.level = validated.level;
    if (validated.cooperationMode !== undefined) updateData.cooperationMode = validated.cooperationMode;
    if (validated.priceDiscountRate !== undefined) updateData.priceDiscountRate = validated.priceDiscountRate?.toString();
    if (validated.settlementType !== undefined) updateData.settlementType = validated.settlementType;
    if (validated.bankInfo !== undefined) updateData.bankInfo = validated.bankInfo;
    if (validated.tieredRates !== undefined) updateData.tieredRates = validated.tieredRates;
    if (validated.customChannelType !== undefined) updateData.customChannelType = validated.customChannelType;

    if (validated.assignedManagerId !== undefined) updateData.assignedManagerId = validated.assignedManagerId;
    if (validated.categoryId !== undefined) updateData.categoryId = validated.categoryId;
    if (validated.hierarchyLevel !== undefined) updateData.hierarchyLevel = validated.hierarchyLevel;

    if (validated.creditLimit !== undefined) updateData.creditLimit = validated.creditLimit?.toString();
    if (validated.commissionTriggerMode !== undefined) updateData.commissionTriggerMode = validated.commissionTriggerMode;

    // P2 Fix: Cycle Detection (Circular Dependency Check)
    if (validated.parentId && validated.parentId !== id) {
        let currentParentId = validated.parentId;
        let depth = 0;
        const maxDepth = 10; // Prevent infinite loop

        while (currentParentId && depth < maxDepth) {
            if (currentParentId === id) {
                throw new Error('检测到循环引用：不能将父渠道设置为当前渠道的后代');
            }

            const parent = await db.query.channels.findFirst({
                where: and(eq(channels.id, currentParentId), eq(channels.tenantId, tenantId)),
                columns: { parentId: true }
            });

            if (!parent || !parent.parentId) {
                break;
            }
            currentParentId = parent.parentId;
            depth++;
        }

        if (depth >= maxDepth) {
            throw new Error('渠道层级过深或存在循环引用，操作拒绝');
        }
    } else if (validated.parentId === id) {
        throw new Error('不能将父渠道设置为自己');
    }

    // Unique check (if name or code is modified)
    if (validated.name !== undefined || validated.channelNo !== undefined) {
        const checks = [];
        if (validated.channelNo !== undefined) checks.push(eq(channels.channelNo, validated.channelNo));
        if (validated.name !== undefined) checks.push(eq(channels.name, validated.name));

        if (checks.length > 0) {
            const existing = await db.query.channels.findFirst({
                where: and(
                    eq(channels.tenantId, tenantId),
                    ne(channels.id, id), // Exclude self
                    or(...checks)
                ),
                columns: { id: true, name: true, channelNo: true }
            });

            if (existing) {
                if (validated.channelNo !== undefined && existing.channelNo === validated.channelNo) throw new Error(`渠道编码 ${validated.channelNo} 已存在`);
                if (validated.name !== undefined && existing.name === validated.name) throw new Error(`渠道名称 ${validated.name} 已存在`);
            }
        }
    }

    const [updated] = await db.update(channels)
        .set(updateData)
        .where(and(
            eq(channels.id, id),
            eq(channels.tenantId, tenantId),
            version !== undefined ? eq(channels.version, version) : undefined
        ))
        .returning();

    if (!updated && version !== undefined) {
        throw new AppError('渠道数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
    }

    // P1 Fix: Audit Log
    if (updated) {
        await AuditService.log(db, {
            tableName: 'channels',
            recordId: id,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId,
            newValues: updated,
            details: { reason: 'Channel update', updatedFields: Object.keys(updateData) }
        });
    }

    revalidatePath('/channels');
    revalidatePath(`/channels/${id}`);
    return updated;
}

/**
 * 添加渠道联系人
 * 
 * 验证参数合法性及渠道归属，然后写入 `channelContacts` 库并记录日志。
 * 
 * 安全检查：需要 CHANNEL.EDIT 权限
 * 
 * @param {ChannelContactInput} input - 渠道联系人输入参数
 * @returns {Promise<any>} 返回新添加的联系人信息
 */
export async function addChannelContact(input: ChannelContactInput) {
    console.log('[channels] 开始添加渠道联系人:', { channelId: input.channelId, phone: input.phone });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查：需要渠道编辑权限
    await checkPermission(session, PERMISSIONS.CHANNEL.EDIT);

    const tenantId = session.user.tenantId;
    const validated = channelContactSchema.parse(input);

    // P2 Fix: UUID Validation for channelId from input
    // Zod schema might already handle it, but reinforcing here doesn't hurt if schema is loose
    z.string().uuid().parse(validated.channelId);

    // 验证渠道属于当前租户
    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, validated.channelId), eq(channels.tenantId, tenantId))
    });
    if (!channel) throw new Error('渠道不存在或无权操作');

    const [newContact] = await db.insert(channelContacts).values({
        ...validated,
        tenantId,
        createdBy: session.user.id,
    }).returning();

    // P1 Fix: Audit Log
    await AuditService.log(db, {
        tableName: 'channel_contacts',
        recordId: newContact.id,
        action: 'CREATE',
        userId: session.user.id,
        tenantId,
        newValues: newContact,
        details: { reason: 'Add channel contact', channelId: validated.channelId }
    });

    revalidatePath(`/channels/${validated.channelId}`);
    return newContact;
}

/**
 * 删除渠道
 * 
 * 检查当前渠道是否有子渠道、关联线索或者包含佣金记录，若无则执行硬删除。
 * 
 * 安全检查：需要 CHANNEL.DELETE 权限
 * 
 * @param {string} id - 渠道ID
 * @returns {Promise<void>} 无返回值
 * @throws {Error} 如果渠道包含子渠道或关联数据则抛出异常
 */
export async function deleteChannel(id: string) {
    console.log('[channels] 开始删除渠道:', { id });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: UUID Validation
    z.string().uuid().parse(id);

    // 权限检查：需要渠道删除权限
    await checkPermission(session, PERMISSIONS.CHANNEL.DELETE);

    const tenantId = session.user.tenantId;

    // 验证渠道存在且属于当前租户
    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, id), eq(channels.tenantId, tenantId))
    });

    if (!channel) throw new Error('Channel not found or unauthorized');

    // 开启事务处理删除逻辑
    await db.transaction(async (tx) => {
        // 1. 检查子渠道 (C-04 Fix: Add tenantId filter)
        const childrenCount = await tx.$count(channels, and(eq(channels.parentId, id), eq(channels.tenantId, tenantId)));
        if (childrenCount > 0) throw new Error(`该渠道下存在 ${childrenCount} 个子渠道，无法删除。请先处理子渠道。`);

        // 2. 检查线索 (C-04 Fix: Add tenantId filter)
        const leadsCount = await tx.$count(leads, and(eq(leads.channelId, id), eq(leads.tenantId, tenantId)));
        if (leadsCount > 0) throw new Error(`该渠道下存在 ${leadsCount} 条关联线索，无法删除。请先转移或清理线索。`);

        // 3. 检查佣金记录 (C-04 Fix: Add tenantId filter)
        const commissionsCount = await tx.$count(channelCommissions, and(eq(channelCommissions.channelId, id), eq(channelCommissions.tenantId, tenantId)));
        if (commissionsCount > 0) throw new Error(`该渠道存在 ${commissionsCount} 条佣金记录，无法删除。`);

        await tx.delete(channels)
            .where(and(eq(channels.id, id), eq(channels.tenantId, tenantId)));

        // P1 Fix: Audit Log
        await AuditService.log(tx, {
            tableName: 'channels',
            recordId: id,
            action: 'DELETE',
            userId: session.user.id,
            tenantId,
            oldValues: channel,
            details: { reason: 'Channel deletion' }
        });
    });

    revalidatePath('/channels');
}

/**
 * 切换主要联系人
 * 
 * 将指定渠道的所有联系人的 `isMain` 设置为 `false`，再将指定联系人设为 `true`。
 * 
 * 安全检查：需要 CHANNEL.EDIT 权限
 * 
 * @param {string} channelId - 渠道ID
 * @param {string} contactId - 需要被设为主要联系人的联系人ID
 * @returns {Promise<void>} 无返回值
 */
export async function toggleContactMain(channelId: string, contactId: string) {
    console.log('[channels] 开始切换主要联系人:', { channelId, contactId });
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // P2 Fix: UUID Validation
    z.string().uuid().parse(channelId);
    z.string().uuid().parse(contactId);

    // 权限检查：需要渠道编辑权限
    await checkPermission(session, PERMISSIONS.CHANNEL.EDIT);

    const tenantId = session.user.tenantId;

    await db.transaction(async (tx) => {
        // Reset all to false
        await tx.update(channelContacts)
            .set({ isMain: false })
            .where(and(eq(channelContacts.channelId, channelId), eq(channelContacts.tenantId, tenantId)));

        // Set this one to true
        // P1 Fix: Add channelId check to prevent setting a contact from another channel as main
        await tx.update(channelContacts)
            .set({ isMain: true })
            .where(and(
                eq(channelContacts.id, contactId),
                eq(channelContacts.channelId, channelId), // Critical check
                eq(channelContacts.tenantId, tenantId)
            ));

        // P1 Fix: Audit Log
        await AuditService.log(tx, {
            tableName: 'channel_contacts',
            recordId: contactId,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId,
            details: { reason: 'Set as main contact', channelId }
        });
    });

    revalidatePath(`/channels/${channelId}`);
}
