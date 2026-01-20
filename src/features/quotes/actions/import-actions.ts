'use server';

import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms, NewQuoteItem } from '@/shared/api/schema/quotes';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface ImportItem {
    roomName: string;
    productName: string;
    width: number;
    height: number;
    quantity: number;
    unitPrice?: number;
    remark?: string;
    category?: string;
}

export async function batchImportQuoteItems(quoteId: string, items: ImportItem[]) {
    if (!items || items.length === 0) return { successCount: 0, errors: [] };

    try {
        await db.transaction(async (tx) => {
            // 0. Fetch Tenant ID from Quote
            const quote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId),
                columns: { tenantId: true }
            });

            if (!quote) throw new Error('Quote not found');
            const { tenantId } = quote;

            // 1. Group by Room Name
            const roomsMap = new Map<string, ImportItem[]>();
            items.forEach(item => {
                const roomName = item.roomName || '未分配';
                if (!roomsMap.has(roomName)) {
                    roomsMap.set(roomName, []);
                }
                roomsMap.get(roomName)!.push(item);
            });

            // 2. Process each room
            for (const [roomName, roomItems] of roomsMap.entries()) {
                let roomId: string | null = null;

                if (roomName !== '未分配') {
                    // Check if room exists
                    const existingRoom = await tx.query.quoteRooms.findFirst({
                        where: (model, { and, eq }) => and(eq(model.quoteId, quoteId), eq(model.name, roomName))
                    });

                    if (existingRoom) {
                        roomId = existingRoom.id;
                    } else {
                        const [newRoom] = await tx.insert(quoteRooms).values({
                            quoteId,
                            tenantId,
                            name: roomName,
                        }).returning();
                        roomId = newRoom.id;
                    }
                }

                // 3. Insert Items
                for (const item of roomItems) {
                    await tx.insert(quoteItems).values({
                        quoteId,
                        tenantId,
                        roomId,
                        productName: item.productName,
                        width: String(item.width || 0),
                        height: String(item.height || 0),
                        quantity: String(item.quantity || 1),
                        unitPrice: String(item.unitPrice || 0),
                        remark: item.remark,
                        category: item.category || 'OTHER',
                        attributeValue: {},
                        subtotal: String((item.quantity || 1) * (item.unitPrice || 0))
                    } as NewQuoteItem);
                }
            }
        });

        revalidatePath(`/quotes/${quoteId}`);
        return { successCount: items.length, errors: [] };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Batch import failed:', error);
        return { successCount: 0, errors: [message] };
    }
}
