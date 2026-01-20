'use server';

import { db } from '@/shared/api/db';
import { channels, channelContacts } from '@/shared/api/schema/channels';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { channelSchema, channelContactSchema, ChannelInput, ChannelContactInput } from './schema';

export async function createChannel(input: ChannelInput, tenantId: string) {
    const validated = channelSchema.parse(input);

    return await db.transaction(async (tx) => {
        const [newChannel] = await tx.insert(channels).values({
            ...validated,
            tenantId,
            commissionRate: validated.commissionRate.toString(),
            priceDiscountRate: validated.priceDiscountRate?.toString(),
            totalLeads: 0,
            totalDealAmount: '0',
            status: 'ACTIVE',
        }).returning();

        // Automatically create the first contact if info is provided
        await tx.insert(channelContacts).values({
            tenantId,
            channelId: newChannel.id,
            name: validated.contactName,
            phone: validated.phone,
            isMain: true,
        });

        revalidatePath('/channels');
        return newChannel;
    });
}

export async function updateChannel(id: string, input: Partial<ChannelInput>, tenantId: string) {
    // 构建更新数据，过滤掉 undefined 值
    const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.channelType !== undefined) updateData.channelType = input.channelType;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.contactName !== undefined) updateData.contactName = input.contactName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.commissionRate !== undefined) updateData.commissionRate = input.commissionRate.toString();
    if (input.priceDiscountRate !== undefined) updateData.priceDiscountRate = input.priceDiscountRate.toString();
    if (input.commissionType !== undefined) updateData.commissionType = input.commissionType;
    if (input.cooperationMode !== undefined) updateData.cooperationMode = input.cooperationMode;
    if (input.settlementType !== undefined) updateData.settlementType = input.settlementType;

    const [updated] = await db.update(channels)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set(updateData as any)
        .where(and(eq(channels.id, id), eq(channels.tenantId, tenantId)))
        .returning();

    revalidatePath('/channels');
    revalidatePath(`/channels/${id}`);
    return updated;
}

export async function addChannelContact(input: ChannelContactInput, tenantId: string) {
    const validated = channelContactSchema.parse(input);

    const [newContact] = await db.insert(channelContacts).values({
        ...validated,
        tenantId,
    }).returning();

    revalidatePath(`/channels/${validated.channelId}`);
    return newContact;
}

export async function deleteChannel(id: string, tenantId: string) {
    await db.delete(channels)
        .where(and(eq(channels.id, id), eq(channels.tenantId, tenantId)));

    revalidatePath('/channels');
}

export async function toggleContactMain(channelId: string, contactId: string, tenantId: string) {
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
