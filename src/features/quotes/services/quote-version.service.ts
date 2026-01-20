import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { eq, and, ne, sql, lt } from 'drizzle-orm';

/**
 * 报价单版本与生命周期增强服务 (Quote Version & Lifecycle Enhancement Service)
 */
export class QuoteVersionService {

    /**
     * 创建新版本 (Create New Version)
     * 自动降级旧版本，确保同一 rootQuoteId 下只有一个 isActive = true
     */
    static async createNewVersion(quoteId: string, userId: string) {
        return await db.transaction(async (tx) => {
            // 1. 获取当前版本
            const currentQuote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId),
                with: {
                    items: true,
                    rooms: true,
                }
            });

            if (!currentQuote) throw new Error('Quote not found');

            const rootQuoteId = currentQuote.rootQuoteId || currentQuote.id;

            // 2. 自动降级所有旧版本 (Demote old versions)
            await tx.update(quotes)
                .set({ isActive: false })
                .where(and(
                    eq(quotes.rootQuoteId, rootQuoteId),
                    eq(quotes.isActive, true)
                ));

            // 3. 复制主表数据 (Deep Clone Quote)
            const nextVersion = (currentQuote.version || 1) + 1;
            const quoteNoBase = currentQuote.quoteNo.split('-V')[0];
            const newQuoteNo = `${quoteNoBase}-V${nextVersion}`;

            const [newQuote] = await tx.insert(quotes).values({
                tenantId: currentQuote.tenantId,
                quoteNo: newQuoteNo,
                customerId: currentQuote.customerId,
                leadId: currentQuote.leadId,
                measureVariantId: currentQuote.measureVariantId,
                rootQuoteId: rootQuoteId,
                parentQuoteId: currentQuote.id,
                isActive: true,
                title: currentQuote.title,
                totalAmount: currentQuote.totalAmount,
                discountRate: currentQuote.discountRate,
                discountAmount: currentQuote.discountAmount,
                finalAmount: currentQuote.finalAmount,
                status: 'DRAFT',
                version: nextVersion,
                validUntil: currentQuote.validUntil,
                notes: currentQuote.notes,
                createdBy: userId,
            }).returning();

            // 4. 复制空间数据 (Clone Rooms)
            const roomMap = new Map<string, string>(); // Old ID -> New ID
            for (const room of currentQuote.rooms) {
                const [newRoom] = await tx.insert(quoteRooms).values({
                    tenantId: room.tenantId,
                    quoteId: newQuote.id,
                    name: room.name,
                    measureRoomId: room.measureRoomId,
                    sortOrder: room.sortOrder,
                }).returning();
                roomMap.set(room.id, newRoom.id);
            }

            // 5. 复制行明细 (Clone Items) - 处理嵌套关系已在此逻辑中简化，实际需考虑 parentId 映射
            const itemMap = new Map<string, string>();

            // 先复制没有 parentId 的主行
            const mainItems = currentQuote.items.filter(i => !i.parentId);
            for (const item of mainItems) {
                const [newItem] = await tx.insert(quoteItems).values({
                    ...item,
                    id: undefined,
                    quoteId: newQuote.id,
                    roomId: item.roomId ? roomMap.get(item.roomId) : null,
                    parentId: null,
                    createdAt: undefined,
                } as any).returning();
                itemMap.set(item.id, newItem.id);
            }

            // 再复制子行 (Accessories)
            const accessoryItems = currentQuote.items.filter(i => i.parentId);
            for (const item of accessoryItems) {
                await tx.insert(quoteItems).values({
                    ...item,
                    id: undefined,
                    quoteId: newQuote.id,
                    roomId: item.roomId ? roomMap.get(item.roomId) : null,
                    parentId: item.parentId ? itemMap.get(item.parentId) : null,
                    createdAt: undefined,
                } as any);
            }

            return newQuote;
        });
    }

    /**
     * 过期处理自动化 (Check for Expirations)
     * 自动将超过 validUntil 的报价单标记为 EXPIRED
     */
    static async checkExpirations() {
        const now = new Date();
        const result = await db.update(quotes)
            .set({ status: 'EXPIRED' })
            .where(and(
                eq(quotes.status, 'SUBMITTED'), // 已提交给客户的才需要过期
                lt(quotes.validUntil, now)
            ))
            .returning({ id: quotes.id });

        return result.length;
    }

    /**
     * 设置为主版本 (Set Active Version)
     */
    static async activate(quoteId: string) {
        return await db.transaction(async (tx) => {
            const quote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId)
            });
            if (!quote) throw new Error('Quote not found');

            const rootQuoteId = quote.rootQuoteId || quote.id;

            // 降级同家族所有版本
            await tx.update(quotes)
                .set({ isActive: false })
                .where(eq(quotes.rootQuoteId, rootQuoteId));

            // 激活当前版本
            await tx.update(quotes)
                .set({ isActive: true })
                .where(eq(quotes.id, quoteId));
        });
    }
}
