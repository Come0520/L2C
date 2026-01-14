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
    // Simplified partial validation for now

    const [updated] = await db.update(channels)
        .set({
            ...input,
            commissionRate: input.commissionRate?.toString(),
            priceDiscountRate: input.priceDiscountRate?.toString(),
            updatedAt: new Date(),
        })
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
