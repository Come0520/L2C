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

    // 🔒 安全校验：添加认证和租户隔离
    const { auth } = await import('@/shared/lib/auth');
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { successCount: 0, errors: ['未授权访问'] };
    }
    const sessionTenantId = session.user.tenantId;

    try {
        await db.transaction(async (tx) => {
            // 🔒 安全校验：验证报价单属于当前租户
            const { and } = await import('drizzle-orm');
            const quote = await tx.query.quotes.findFirst({
                where: and(
                    eq(quotes.id, quoteId),
                    eq(quotes.tenantId, sessionTenantId) // 强制租户过滤
                ),
                columns: { tenantId: true }
            });

            if (!quote) throw new Error('报价单不存在或无权访问');
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
