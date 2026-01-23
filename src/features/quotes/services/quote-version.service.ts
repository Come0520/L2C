import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { eq, and, lt, InferInsertModel } from 'drizzle-orm';

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

            type NewQuoteItem = InferInsertModel<typeof quoteItems>;

            // 先复制没有 parentId 的主行
            const mainItems = currentQuote.items.filter(i => !i.parentId);
            for (const item of mainItems) {
                // 显式构造新对象，避免 spread 不兼容类型
                const newItemData: NewQuoteItem = {
                    tenantId: item.tenantId,
                    quoteId: newQuote.id,
                    parentId: null,
                    roomId: item.roomId ? roomMap.get(item.roomId) : null,
                    category: item.category,
                    productId: item.productId,
                    productName: item.productName,
                    productSku: item.productSku,
                    roomName: item.roomName,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    costPrice: item.costPrice,
                    quantity: item.quantity,
                    width: item.width,
                    height: item.height,
                    foldRatio: item.foldRatio,
                    processFee: item.processFee,
                    subtotal: item.subtotal,
                    attributes: item.attributes,
                    calculationParams: item.calculationParams,
                    remark: item.remark,
                    sortOrder: item.sortOrder,
                };
                const [newItem] = await tx.insert(quoteItems).values(newItemData).returning();
                itemMap.set(item.id, newItem.id);
            }

            // 再复制子行 (Accessories)
            const accessoryItems = currentQuote.items.filter(i => i.parentId);
            for (const item of accessoryItems) {
                const newItemData: NewQuoteItem = {
                    tenantId: item.tenantId,
                    quoteId: newQuote.id,
                    parentId: item.parentId ? itemMap.get(item.parentId) : null,
                    roomId: item.roomId ? roomMap.get(item.roomId) : null,
                    category: item.category,
                    productId: item.productId,
                    productName: item.productName,
                    productSku: item.productSku,
                    roomName: item.roomName,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    costPrice: item.costPrice,
                    quantity: item.quantity,
                    width: item.width,
                    height: item.height,
                    foldRatio: item.foldRatio,
                    processFee: item.processFee,
                    subtotal: item.subtotal,
                    attributes: item.attributes,
                    calculationParams: item.calculationParams,
                    remark: item.remark,
                    sortOrder: item.sortOrder,
                };
                await tx.insert(quoteItems).values(newItemData);
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
                eq(quotes.status, 'PENDING_CUSTOMER'), // 已提交给客户的才需要过期
                lt(quotes.validUntil, now)
            ))
            .returning({ id: quotes.id });

        return result.length;
    }

    /**
     * 设置为主版本 (Set Active Version)
     * @param quoteId - 报价单 ID
     * @param tenantId - 租户 ID（用于安全验证）
     */
    static async activate(quoteId: string, tenantId?: string) {
        return await db.transaction(async (tx) => {
            const quote = await tx.query.quotes.findFirst({
                where: tenantId
                    ? and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId))
                    : eq(quotes.id, quoteId)
            });
            if (!quote) throw new Error('报价单不存在或无权操作');

            const rootQuoteId = quote.rootQuoteId || quote.id;

            // 降级同家族所有版本（限定相同租户）
            await tx.update(quotes)
                .set({ isActive: false })
                .where(tenantId
                    ? and(eq(quotes.rootQuoteId, rootQuoteId), eq(quotes.tenantId, tenantId))
                    : eq(quotes.rootQuoteId, rootQuoteId)
                );

            // 激活当前版本
            await tx.update(quotes)
                .set({ isActive: true })
                .where(tenantId
                    ? and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId))
                    : eq(quotes.id, quoteId)
                );
        });
    }
}
