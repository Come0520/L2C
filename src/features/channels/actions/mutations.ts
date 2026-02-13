'use server';

import { db } from '@/shared/api/db';
import { channels, channelContacts, channelCommissions } from '@/shared/api/schema/channels';
import { leads } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { channelSchema, channelContactSchema, ChannelInput, ChannelContactInput } from './schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

/**
 * 创建渠道
 * 
 * 安全检查：需要 CHANNEL.CREATE 权限
 */
export async function createChannel(input: ChannelInput) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查：需要渠道创建权限
    await checkPermission(session, PERMISSIONS.CHANNEL.CREATE);

    const tenantId = session.user.tenantId;
    const validated = channelSchema.parse(input);

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
            priceDiscountRate: validated.priceDiscountRate?.toString(),
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

        revalidatePath('/channels');
        return newChannel;
    });
}

/**
 * 更新渠道
 * 
 * 安全检查：需要 CHANNEL.EDIT 权限
 */
export async function updateChannel(id: string, input: Partial<ChannelInput>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查：需要渠道编辑权限
    await checkPermission(session, PERMISSIONS.CHANNEL.EDIT);

    const tenantId = session.user.tenantId;

    // 构建更新数据，过滤掉 undefined 值
    const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
    };

    // 层级字段
    if (input.parentId !== undefined) updateData.parentId = input.parentId;
    if (input.hierarchyLevel !== undefined) updateData.hierarchyLevel = input.hierarchyLevel;
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;

    // 基础信息
    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.channelType !== undefined) updateData.channelType = input.channelType;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.contactName !== undefined) updateData.contactName = input.contactName;
    if (input.phone !== undefined) updateData.phone = input.phone;

    // 财务配置
    if (input.commissionRate !== undefined) updateData.commissionRate = input.commissionRate.toString();
    if (input.priceDiscountRate !== undefined) updateData.priceDiscountRate = input.priceDiscountRate.toString();
    if (input.commissionType !== undefined) updateData.commissionType = input.commissionType;
    if (input.cooperationMode !== undefined) updateData.cooperationMode = input.cooperationMode;
    if (input.settlementType !== undefined) updateData.settlementType = input.settlementType;

    const [updated] = await db.update(channels)
        .set(updateData)
        .where(and(eq(channels.id, id), eq(channels.tenantId, tenantId)))
        .returning();

    revalidatePath('/channels');
    revalidatePath(`/channels/${id}`);
    return updated;
}

/**
 * 添加渠道联系人
 * 
 * 安全检查：需要 CHANNEL.EDIT 权限
 */
export async function addChannelContact(input: ChannelContactInput) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查：需要渠道编辑权限
    await checkPermission(session, PERMISSIONS.CHANNEL.EDIT);

    const tenantId = session.user.tenantId;
    const validated = channelContactSchema.parse(input);

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

    revalidatePath(`/channels/${validated.channelId}`);
    return newContact;
}

/**
 * 删除渠道
 * 
 * 安全检查：需要 CHANNEL.DELETE 权限
 */
export async function deleteChannel(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查：需要渠道删除权限
    await checkPermission(session, PERMISSIONS.CHANNEL.DELETE);

    const tenantId = session.user.tenantId;

    // 检查关联数据
    // 1. 检查是否有线索
    const hasLeads = await db.query.leads.findFirst({
        where: and(eq(leads.channelId, id), eq(leads.tenantId, tenantId))
    });
    if (hasLeads) throw new Error('该渠道下存在关联线索，无法删除');

    // 2. 检查是否有佣金记录
    const hasCommissions = await db.query.channelCommissions.findFirst({
        where: and(eq(channelCommissions.channelId, id), eq(channelCommissions.tenantId, tenantId))
    });
    if (hasCommissions) throw new Error('该渠道下存在佣金记录，无法删除');

    await db.delete(channels)
        .where(and(eq(channels.id, id), eq(channels.tenantId, tenantId)));

    revalidatePath('/channels');
}

/**
 * 切换主要联系人
 * 
 * 安全检查：需要 CHANNEL.EDIT 权限
 */
export async function toggleContactMain(channelId: string, contactId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 权限检查：需要渠道编辑权限
    await checkPermission(session, PERMISSIONS.CHANNEL.EDIT);

    const tenantId = session.user.tenantId;

    await db.transaction(async (tx) => {
        // Reset all to false
        await tx.update(channelContacts)
            .set({ isMain: false })
            .where(and(eq(channelContacts.channelId, channelId), eq(channelContacts.tenantId, tenantId)));

        // Set this one to true
        await tx.update(channelContacts)
            .set({ isMain: true })
            .where(and(eq(channelContacts.id, contactId), eq(channelContacts.tenantId, tenantId)));
    });

    revalidatePath(`/channels/${channelId}`);
}
