import { db } from "@/shared/api/db";
import { quotes, quoteItems, quoteRooms } from "@/shared/api/schema/quotes";
import { measureSheets, measureItems } from "@/shared/api/schema/service";
import { tenants } from "@/shared/api/schema/infrastructure";
import { eq, and, InferSelectModel } from "drizzle-orm";

type MeasureItem = InferSelectModel<typeof measureItems>;
type QuoteItemWithMatched = InferSelectModel<typeof quoteItems> & { _matched?: boolean };

export interface ImportAction {
    type: 'CREATE_ROOM' | 'CREATE_ITEM' | 'UPDATE_ITEM';
    description: string;
    data: Record<string, unknown>;
    measureItem: Record<string, unknown>;
    diff?: { field: string, oldValue: unknown, newValue: unknown }[];
}

export interface ImportPreviewResult {
    actions: ImportAction[];
    summary: { created: number, updated: number, ignored: number };
}

interface TenantSettings {
    quoteConfig?: {
        minProfitMargin?: number;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export class QuoteService {

    /**
     * Create a new version of an existing quote.
     */
    static async createNextVersion(quoteId: string, userId: string) {
        return await db.transaction(async (tx) => {
            // 1. Fetch original quote with all its parts
            const originalQuote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId),
                with: {
                    rooms: true,
                    items: true
                }
            });

            if (!originalQuote) throw new Error("Quote not found");

            const rootQuoteId = originalQuote.rootQuoteId || originalQuote.id;

            // 2. Deactivate all existing versions in this chain
            await tx.update(quotes)
                .set({ isActive: false })
                .where(eq(quotes.rootQuoteId, rootQuoteId));

            const newVersion = (originalQuote.version || 1) + 1;
            const baseQuoteNo = originalQuote.quoteNo.replace(/-V\d+$/, '');
            const finalQuoteNo = `${baseQuoteNo}-V${newVersion}`;

            // 3. Insert new Quote header
            const newQuoteData = {
                tenantId: originalQuote.tenantId,
                customerId: originalQuote.customerId,
                quoteNo: finalQuoteNo,
                version: newVersion,
                totalAmount: originalQuote.totalAmount?.toString() || '0',
                finalAmount: originalQuote.finalAmount?.toString() || '0',
                discountAmount: originalQuote.discountAmount?.toString() || '0',
                status: 'DRAFT' as const,
                parentQuoteId: originalQuote.id,
                rootQuoteId: rootQuoteId,
                isActive: true,
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                notes: originalQuote.notes,
            };

            const [newQuote] = await tx.insert(quotes).values(newQuoteData).returning();

            // 4. Clone Rooms & Build ID Mapping
            const roomIdMap = new Map<string, string>();
            for (const room of originalQuote.rooms) {
                const [newRoom] = await tx.insert(quoteRooms).values({
                    tenantId: originalQuote.tenantId,
                    quoteId: newQuote.id,
                    name: room.name,
                    measureRoomId: room.measureRoomId,
                    sortOrder: room.sortOrder,
                    createdAt: new Date()
                }).returning();
                roomIdMap.set(room.id, newRoom.id);
            }

            // 5. Clone Items & Handle parentId Mapping
            // We need to process root items first, then accessories
            const itemIdMap = new Map<string, string>();
            const sortedItems = [...originalQuote.items].sort((a, b) => {
                // Root items (parentId == null) first
                if (!a.parentId && b.parentId) return -1;
                if (a.parentId && !b.parentId) return 1;
                return 0;
            });

            for (const item of sortedItems) {
                const newItemData = {
                    tenantId: newQuote.tenantId,
                    quoteId: newQuote.id,
                    roomId: item.roomId ? roomIdMap.get(item.roomId) : null,
                    parentId: item.parentId ? itemIdMap.get(item.parentId) : null,
                    category: item.category,
                    productId: item.productId,
                    productName: item.productName,
                    unit: item.unit,
                    unitPrice: item.unitPrice?.toString() || '0',
                    quantity: item.quantity?.toString() || '0',
                    width: item.width?.toString() || null,
                    height: item.height?.toString() || null,
                    foldRatio: item.foldRatio?.toString() || null,
                    processFee: item.processFee?.toString() || null,
                    subtotal: item.subtotal?.toString() || '0',
                    remark: item.remark,
                    attributes: item.attributes,
                    createdAt: new Date()
                };
                const [newItem] = await tx.insert(quoteItems).values(newItemData).returning();
                itemIdMap.set(item.id, newItem.id);
            }

            return newQuote;
        });
    }

    /**
     * Get all versions of a quote family.
     */
    static async getQuoteHistory(rootQuoteId: string) {
        return await db.query.quotes.findMany({
            where: eq(quotes.rootQuoteId, rootQuoteId),
            orderBy: (q, { desc }) => [desc(q.version)],
            with: {
                creator: true
            }
        });
    }

    /**
     * Preview measurement data import to calculate diffs.
     */
    static async previewMeasurementImport(quoteId: string, measureTaskId: string): Promise<ImportPreviewResult> {
        const quote = await db.query.quotes.findFirst({
            where: eq(quotes.id, quoteId),
            with: {
                rooms: {
                    with: {
                        items: true
                    }
                },
                items: true // items without room
            }
        });

        if (!quote) throw new Error('Quote not found');

        // Get the latest completed sheet/variant
        // In real app, we might let user select specific sheet, here we pick first/latest
        const measureSheet = await db.query.measureSheets.findFirst({
            where: eq(measureSheets.taskId, measureTaskId),
            with: {
                items: true
            },
            orderBy: (sheets, { desc }) => [desc(sheets.createdAt)]
        });

        if (!measureSheet) throw new Error('Measurement sheet not found');

        const actions: ImportAction[] = [];
        const summary = { created: 0, updated: 0, ignored: 0 };

        // Group Quote Items by Room Name -> Item List
        const quoteMap = new Map<string, typeof quote.items>();
        // Initialize with existing rooms
        quote.rooms.forEach(r => {
            quoteMap.set(r.name, r.items);
        });
        // Handle global items if any (keyed by 'Global' or similar, strict matching uses room names)

        for (const mItem of measureSheet.items) {
            const roomName = mItem.roomName;
            const existingRoomItems = quoteMap.get(roomName || '');

            if (!existingRoomItems) {
                // Case 1: Room does not exist -> Create Room & Item
                actions.push({
                    type: 'CREATE_ROOM',
                    description: `创建新空间: ${roomName}`,
                    data: { roomName: roomName },
                    measureItem: mItem as unknown as Record<string, unknown>
                });
                actions.push({
                    type: 'CREATE_ITEM',
                    description: `新增: ${mItem.windowType} (${mItem.width}x${mItem.height})`,
                    data: this.mapMeasureItemToQuoteItem(mItem, quote.id, null), // roomId will be resolved later
                    measureItem: mItem as unknown as Record<string, unknown>
                });
                summary.created++;
                // Mark room as "processed" to avoid duplicate create room actions if multiple items in same new room
                quoteMap.set(roomName || '', []);
                continue;
            }

            // Case 2: Room exists -> Try to match item
            const matchedQuoteItem = (existingRoomItems as QuoteItemWithMatched[]).find(qItem =>
                (qItem.productName === mItem.windowType || qItem.category === this.mapWindowTypeToCategory(mItem.windowType || '')) &&
                !qItem._matched // internal flag to prevent double matching in this loop
            );

            if (matchedQuoteItem) {
                // Check for Diff
                const qWidth = Number(matchedQuoteItem.width || 0);
                const qHeight = Number(matchedQuoteItem.height || 0);
                const mWidth = Number(mItem.width || 0);
                const mHeight = Number(mItem.height || 0);

                const hasDiff = Math.abs(qWidth - mWidth) > 5 || Math.abs(qHeight - mHeight) > 5; // tolerance 5mm?

                if (hasDiff) {
                    actions.push({
                        type: 'UPDATE_ITEM',
                        description: `校准: ${roomName} - ${mItem.windowType}`,
                        data: { id: matchedQuoteItem.id },
                        measureItem: mItem as unknown as Record<string, unknown>,
                        diff: [
                            { field: 'width', oldValue: qWidth, newValue: mWidth },
                            { field: 'height', oldValue: qHeight, newValue: mHeight }
                        ]
                    });
                    summary.updated++;
                } else {
                    summary.ignored++;
                }
                (matchedQuoteItem as QuoteItemWithMatched)._matched = true;
            } else {
                // Case 3: Room exists, but item not found -> Create Item
                actions.push({
                    type: 'CREATE_ITEM',
                    description: `新增: ${roomName} - ${mItem.windowType}`,
                    data: this.mapMeasureItemToQuoteItem(mItem, quote.id, quote.rooms.find(r => r.name === roomName)?.id ?? null),
                    measureItem: mItem as unknown as Record<string, unknown>
                });
                summary.created++;
            }
        }

        return { actions, summary };
    }

    /**
     * Execute selected import actions.
     */
    static async executeMeasurementImport(quoteId: string, actions: ImportAction[]) {
        const quote = await db.query.quotes.findFirst({
            where: eq(quotes.id, quoteId),
            with: { rooms: true }
        });

        if (!quote) throw new Error('Quote not found');

        const results = [];

        // 1. Process Create Rooms first to ensure IDs exist
        const roomActions = actions.filter(a => a.type === 'CREATE_ROOM');
        // Cache created rooms to avoid duplicates if action list has multiple same room creates (though preview logic handles this, best to be safe)
        const createdRoomMap = new Map<string, string>();

        for (const action of roomActions) {
            const roomName = action.measureItem?.roomName as string;

            if (createdRoomMap.has(roomName) || quote.rooms.some(r => r.name === roomName)) {
                // Already exists or created
                const existing = quote.rooms.find(r => r.name === roomName);
                if (existing) createdRoomMap.set(roomName, existing.id);
                continue;
            }

            const [newRoom] = await db.insert(quoteRooms).values({
                quoteId: quoteId,
                name: roomName || '默认空间',
                tenantId: quote.tenantId,
                measureRoomId: (action.measureItem?.id as string) || null,
                createdAt: new Date()
            }).returning();
            createdRoomMap.set(roomName, newRoom.id);
            results.push({ type: 'CREATE_ROOM', id: newRoom.id, name: roomName });
        }

        // 2. Process Items
        const itemActions = actions.filter(a => a.type !== 'CREATE_ROOM');

        for (const action of itemActions) {
            if (action.type === 'CREATE_ITEM') {
                let roomId = action.data.roomId as string | undefined;
                const roomName = action.measureItem?.roomName as string | undefined;

                // If roomId is null, try to find it from created rooms or existing rooms
                if (!roomId && roomName) {
                    roomId = createdRoomMap.get(roomName);
                    if (!roomId) {
                        const existing = await db.query.quoteRooms.findFirst({
                            where: and(eq(quoteRooms.quoteId, quoteId), eq(quoteRooms.name, roomName))
                        });
                        if (existing) roomId = existing.id;
                    }
                }

                if (roomId) {
                    const [newItem] = await db.insert(quoteItems).values({
                        tenantId: quote.tenantId,
                        quoteId: quoteId,
                        roomId: roomId,
                        category: (action.data.category as string) || 'CURTAIN_FABRIC',
                        productName: (action.data.productName as string) || 'Unknown',
                        unitPrice: action.data.unitPrice?.toString() || '0',
                        quantity: action.data.quantity?.toString() || '1',
                        subtotal: action.data.subtotal?.toString() || '0',
                        width: action.data.width?.toString() || null,
                        height: action.data.height?.toString() || null,
                        attributes: (action.data.attributes as Record<string, unknown>) || {},
                        createdAt: new Date()
                    }).returning();
                    results.push({ type: 'CREATE_ITEM', id: newItem.id });
                }
            }
            else if (action.type === 'UPDATE_ITEM') {
                const mItem = action.measureItem as MeasureItem;
                // Update specific fields (dimensions)
                await db.update(quoteItems)
                    .set({
                        width: mItem.width?.toString(),
                        height: mItem.height?.toString(),
                    })
                    .where(eq(quoteItems.id, action.data.id as string));
                results.push({ type: 'UPDATE_ITEM', id: action.data.id as string });
            }
        }

        await this.updateQuoteTotal(quoteId);
        return { success: true, count: results.length };
    }

    private static mapMeasureItemToQuoteItem(mItem: MeasureItem, quoteId: string, roomId: string | null) {
        return {
            quoteId,
            roomId, // might be null if room needs creation
            category: this.mapWindowTypeToCategory(mItem.windowType || ''),
            productName: mItem.windowType || 'Unknown',
            unit: '米', // Default
            quantity: '1',
            width: mItem.width?.toString(),
            subtotal: '0', // Initial 0, will be updated by recalculation or trigger
            attributes: {
                installType: mItem.installType,
                wallMaterial: mItem.wallMaterial,
                bracketDist: mItem.bracketDist,
                hasBox: mItem.hasBox,
                boxDepth: mItem.boxDepth,
                isElectric: mItem.isElectric,
                remark: mItem.remark,
                segmentData: mItem.segmentData
            }
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

        const total = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);

        await db.update(quotes)
            .set({
                totalAmount: total.toFixed(2),
                finalAmount: total.toFixed(2),
                updatedAt: new Date()
            })
            .where(eq(quotes.id, quoteId));
    }

    /**
     * Calculate risk for a quote based on tenant settings.
     */
    static async calculateQuoteRisk(quoteId: string) {
        const quote = await db.query.quotes.findFirst({
            where: eq(quotes.id, quoteId),
            with: { items: true }
        });

        if (!quote) throw new Error("Quote not found");

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, quote.tenantId)
        });

        const settings = (tenant?.settings || {}) as TenantSettings;

        const { checkDiscountRisk } = await import('../features/quotes/logic/risk-control');

        const result = checkDiscountRisk(
            quote.items,
            Number(quote.finalAmount),
            Number(quote.totalAmount),
            settings
        );

        // Update quote with risk info
        await db.update(quotes).set({
            approvalRequired: result.isRisk,
            minProfitMargin: (settings.quoteConfig?.minProfitMargin || 0.15).toString()
        }).where(eq(quotes.id, quoteId));

        return result;
    }

    static async submitQuote(quoteId: string) {
        const risk = await this.calculateQuoteRisk(quoteId);

        if (risk.hardStop) {
            throw new Error("Quote cannot be submitted due to serious risk: " + risk.reason.join(", "));
        }

        const status = risk.isRisk ? 'PENDING_APPROVAL' : 'PENDING_CUSTOMER';

        await db.update(quotes).set({
            status: status,
            lockedAt: new Date()
        }).where(eq(quotes.id, quoteId));

        return { status, risk };
    }
}
