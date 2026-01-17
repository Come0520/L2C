import { db } from "@/shared/api/db";
import { quotes, quoteItems, quoteRooms } from "@/shared/api/schema/quotes";
import { measureSheets, measureItems } from "@/shared/api/schema/service";
import { eq, and } from "drizzle-orm";

export class QuoteService {

    /**
     * Create a new version of an existing quote.
     */
    static async createNextVersion(quoteId: string, userId: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            const originalQuote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId),
                with: {
                    items: true
                } as any
            });

            if (!originalQuote) throw new Error("Quote not found");

            const rootQuoteId = originalQuote.rootQuoteId || originalQuote.id;

            const originalItems = await tx.query.quoteItems.findMany({
                where: eq(quoteItems.quoteId, quoteId)
            });

            await tx.update(quotes)
                .set({ isActive: false })
                .where(and(
                    eq(quotes.rootQuoteId, rootQuoteId),
                    eq(quotes.isActive, true)
                ));

            await tx.update(quotes)
                .set({ isActive: false })
                .where(eq(quotes.id, quoteId));

            const newVersion = (originalQuote.version || 1) + 1;
            const baseQuoteNo = originalQuote.quoteNo.replace(/-V\d+$/, '');
            const finalQuoteNo = `${baseQuoteNo}-V${newVersion}`;

            // Handle optional fields explicitly to avoid type issues
            const newQuoteData: any = {
                ...originalQuote,
                id: undefined,
                quoteNo: finalQuoteNo,
                version: newVersion,
                parentQuoteId: originalQuote.id,
                rootQuoteId: rootQuoteId,
                isActive: true,
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
                lockedAt: null,
                createdBy: userId,
                approvedAt: null,
                approverId: null,
                rejectReason: null
            };

            const [newQuote] = await tx.insert(quotes).values(newQuoteData).returning();

            if (originalItems.length > 0) {
                const newItems = originalItems.map(item => ({
                    ...item,
                    id: undefined,
                    quoteId: newQuote.id,
                    createdAt: new Date()
                }));
                // Use any casting for batch insert if types are tricky with inferred schema
                await tx.insert(quoteItems).values(newItems as any);
            }

            return newQuote;
        });
    }

    /**
     * Import measurement data into quote items.
     */
    static async importMeasurementData(quoteId: string, measureTaskId: string) {
        const quote = await db.query.quotes.findFirst({
            where: eq(quotes.id, quoteId),
            with: {
                rooms: true
            }
        });

        if (!quote) throw new Error('Quote not found');

        const measureSheet = await db.query.measureSheets.findFirst({
            where: eq(measureSheets.taskId, measureTaskId)
        });

        if (!measureSheet) throw new Error('Measurement sheet not found');

        const mItems = await db.query.measureItems.findMany({
            where: eq(measureItems.sheetId, measureSheet.id)
        });

        const importedItems = [];
        for (const measureItem of mItems) {
            let quoteRoom = quote.rooms.find(r => r.name === measureItem.roomName);

            if (!quoteRoom) {
                const [newRoom] = await db.insert(quoteRooms).values({
                    quoteId,
                    name: measureItem.roomName,
                    tenantId: quote.tenantId,
                    measureRoomId: measureItem.id
                }).returning();
                quoteRoom = newRoom;
            }

            const quoteItemData: any = {
                quoteId,
                roomId: quoteRoom.id,
                tenantId: quote.tenantId,
                category: this.mapWindowTypeToCategory(measureItem.windowType),
                productName: measureItem.windowType,
                productSku: '',
                roomName: measureItem.roomName,
                unit: '米',
                unitPrice: '0',
                quantity: '1',
                width: measureItem.width?.toString(),
                height: measureItem.height?.toString(),
                foldRatio: '2',
                processFee: '0',
                subtotal: '0',
                attributes: {
                    installType: measureItem.installType,
                    bracketDist: measureItem.bracketDist,
                    wallMaterial: measureItem.wallMaterial,
                    hasBox: measureItem.hasBox,
                    boxDepth: measureItem.boxDepth,
                    isElectric: measureItem.isElectric,
                    remark: measureItem.remark,
                    segmentData: measureItem.segmentData
                },
                calculationParams: {
                    measuredWidth: Number(measureItem.width),
                    measuredHeight: Number(measureItem.height),
                    formula: 'FIXED_HEIGHT',
                    sideLoss: 0,
                    bottomLoss: 0,
                    headerLoss: 0
                },
                sortOrder: 0
            };

            const [newItem] = await db.insert(quoteItems).values(quoteItemData).returning();
            importedItems.push(newItem);
        }

        await this.updateQuoteTotal(quoteId);

        return {
            success: true,
            importedCount: importedItems.length,
            items: importedItems
        };
    }

    private static mapWindowTypeToCategory(windowType: string): string {
        const typeMap: Record<string, string> = {
            'CURTAIN': 'CURTAIN_FABRIC',
            'ROLLER': 'CURTAIN_FABRIC',
            'VENETIAN': 'CURTAIN_FABRIC',
            'VERTICAL': 'CURTAIN_FABRIC',
            'ROMAN': 'CURTAIN_FABRIC',
            'PLEATED': 'CURTAIN_FABRIC',
            'WALLPAPER': 'WALLPAPER',
            'WALLCLOTH': 'WALLCLOTH',
            'SHUTTER': 'SHUTTER'
        };
        return typeMap[windowType] || 'CURTAIN_FABRIC';
    }

    private static async updateQuoteTotal(quoteId: string) {
        const items = await db.query.quoteItems.findMany({
            where: eq(quoteItems.quoteId, quoteId)
        });

        const total = items.reduce((acc, item) => acc + Number(item.subtotal), 0);

        await db.update(quotes)
            .set({
                totalAmount: total.toFixed(2),
                finalAmount: total.toFixed(2),
                updatedAt: new Date()
            })
            .where(eq(quotes.id, quoteId));
    }
}
