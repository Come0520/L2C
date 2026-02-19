import { db } from "@/shared/api/db";
import { quotes, quoteItems, quoteRooms } from "@/shared/api/schema/quotes";
import { measureSheets, measureItems } from "@/shared/api/schema/service";
import { tenants } from "@/shared/api/schema/infrastructure";
import { eq, and, ne, InferSelectModel, lt, inArray } from 'drizzle-orm';
import { checkDiscountRisk } from '@/features/quotes/logic/risk-control';
import { updateQuoteTotal } from '@/features/quotes/actions/shared-helpers';
import Decimal from 'decimal.js';

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
     * Activate a specific version of a quote, deactivating others in the same version chain.
     * @param quoteId - The ID of the quote version to activate.
     * @param tenantId - The tenant ID to ensure ownership.
     */
    static async activateVersion(quoteId: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            // 1. Get the quote to find rootId
            const quote = await tx.query.quotes.findFirst({
                where: and(
                    eq(quotes.id, quoteId),
                    eq(quotes.tenantId, tenantId)
                )
            });

            if (!quote) throw new Error('Quote not found');

            // 2. Deactivate all other versions in the chain
            // 使用 isActive 字段而不是 status 来控制版本激活状态
            if (quote.rootQuoteId) {
                await tx.update(quotes)
                    .set({ isActive: false, updatedAt: new Date() })
                    .where(and(
                        eq(quotes.rootQuoteId, quote.rootQuoteId),
                        eq(quotes.isActive, true),
                        ne(quotes.id, quoteId),
                        eq(quotes.tenantId, tenantId)
                    ));
            }

            // 3. Activate target version
            const [activated] = await tx.update(quotes)
                .set({ isActive: true, updatedAt: new Date() })
                .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)))
                .returning();

            return activated;
        });
    }
    /**
     * Create a new version of an existing quote.
     */
    static async createNextVersion(quoteId: string, userId: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            // 1. Fetch original quote with all its parts
            const originalQuote = await tx.query.quotes.findFirst({
                where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
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
                .where(and(eq(quotes.rootQuoteId, rootQuoteId), eq(quotes.tenantId, tenantId)));

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
                bundleId: originalQuote.bundleId,
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
     * 复制报价单为新的独立报价单
     * 与 createNextVersion 不同，这会创建一个全新的版本链（独立的报价单）
     * 
     * @param quoteId - 源报价单 ID
     * @param userId - 创建者用户 ID
     * @param targetCustomerId - 可选，目标客户 ID（用于为不同客户复制报价）
     * @param tenantId - 租户 ID
     */
    static async copyQuote(quoteId: string, userId: string, tenantId: string, targetCustomerId?: string) {
        return await db.transaction(async (tx) => {
            // 1. 获取原始报价单及其所有部件
            const originalQuote = await tx.query.quotes.findFirst({
                where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
                with: {
                    rooms: true,
                    items: true
                }
            });

            if (!originalQuote) throw new Error("报价单不存在");

            // 2. 生成新的报价单号（完全独立，不继承原报价单号）
            const newQuoteNo = `QT${Date.now()}`;

            // 3. 创建新的报价单（独立版本链，version = 1）
            const newQuoteData = {
                tenantId: originalQuote.tenantId,
                customerId: targetCustomerId || originalQuote.customerId,
                quoteNo: newQuoteNo,
                version: 1, // 新报价单从版本 1 开始
                totalAmount: originalQuote.totalAmount?.toString() || '0',
                finalAmount: originalQuote.finalAmount?.toString() || '0',
                discountAmount: originalQuote.discountAmount?.toString() || '0',
                discountRate: originalQuote.discountRate?.toString() || '1',
                status: 'DRAFT' as const,
                parentQuoteId: null, // 无父报价单（独立副本）
                rootQuoteId: null as string | null, // 将在插入后设置为自身 ID
                isActive: true,
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                notes: originalQuote.notes ? `[复制自 ${originalQuote.quoteNo}] ${originalQuote.notes}` : `复制自 ${originalQuote.quoteNo}`,
                title: originalQuote.title,
            };

            const [newQuote] = await tx.insert(quotes).values(newQuoteData).returning();

            // 4. 设置 rootQuoteId 为自身（新的版本链根）
            await tx.update(quotes)
                .set({ rootQuoteId: newQuote.id })
                .where(eq(quotes.id, newQuote.id));

            // 5. 复制空间并建立 ID 映射
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

            // 6. 复制报价项并处理 parentId 映射
            const itemIdMap = new Map<string, string>();
            const sortedItems = [...originalQuote.items].sort((a, b) => {
                // 主商品优先（parentId == null）
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

            return { ...newQuote, rootQuoteId: newQuote.id };
        });
    }

    /**
     * Get all versions of a quote family.
     */
    static async getQuoteHistory(rootQuoteId: string, tenantId: string) {
        return await db.query.quotes.findMany({
            where: and(eq(quotes.rootQuoteId, rootQuoteId), eq(quotes.tenantId, tenantId)),
            orderBy: (q, { desc }) => [desc(q.version)],
            with: {
                creator: true
            }
        });
    }

    /**
    /**
     * Preview measurement data import to calculate diffs.
     * 🔒 Tenant Isolation: Added tenantId check
     */
    static async previewMeasurementImport(quoteId: string, measureTaskId: string, tenantId: string): Promise<ImportPreviewResult> {
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
            with: {
                rooms: {
                    with: {
                        items: true
                    }
                },
                items: true // items without room
            }
        });

        if (!quote) throw new Error('Quote not found or access denied');

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
     * 🔒 Tenant Isolation: Added tenantId check
     */
    static async executeMeasurementImport(quoteId: string, actions: ImportAction[], tenantId: string) {
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
            with: { rooms: true }
        });

        if (!quote) throw new Error('Quote not found or access denied');

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
                // 🔒 P0-02 安全修复：UPDATE_ITEM 添加租户隔离
                await db.update(quoteItems)
                    .set({
                        width: mItem.width?.toString(),
                        height: mItem.height?.toString(),
                    })
                    .where(and(
                        eq(quoteItems.id, action.data.id as string),
                        eq(quoteItems.tenantId, tenantId)
                    ));
                results.push({ type: 'UPDATE_ITEM', id: action.data.id as string });
            }
        }

        // P2-R4-01: 使用 shared-helpers 的公共版本（含 Decimal.js 精度 + 折扣逻辑）
        await updateQuoteTotal(quoteId, tenantId);
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

    // P2-R4-01: 已移除废弃的私有 updateQuoteTotal 方法
    // 原因：使用原生 Number 累加存在精度问题，且未应用折扣逻辑
    // 替代：P1-R4-03 已在 refreshExpiredQuotePrices 事务内使用 Decimal.js 内联计算
    // 其他调用点应使用 shared-helpers.ts 中的公共 updateQuoteTotal

    /**
     * Calculate risk for a quote based on tenant settings.
     */
    /**
     * Calculate risk for a quote based on tenant settings.
     */
    static async calculateQuoteRisk(quoteId: string, tenantId: string) {
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
            with: { items: true }
        });

        if (!quote) throw new Error("Quote not found");

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, quote.tenantId)
        });

        const settings = (tenant?.settings || {}) as TenantSettings;

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
        }).where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

        return result;
    }

    /**
     * @deprecated Use QuoteLifecycleService.submit instead
     */
    static async submitQuote(quoteId: string, tenantId: string) {
        const risk = await this.calculateQuoteRisk(quoteId, tenantId);

        if (risk.hardStop) {
            throw new Error("Quote cannot be submitted due to serious risk: " + risk.reason.join(", "));
        }

        const status = risk.isRisk ? 'PENDING_APPROVAL' : 'PENDING_CUSTOMER';

        await db.update(quotes).set({
            status,
            lockedAt: new Date()
        }).where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

        return { status, risk };
    }

    /**
     * 检查并标记过期报价 (Check and Expire Quote)
     * 用于单个报价访问时的实时检查
     * 
     * @param quoteId - 报价ID
     * @param tenantId - 租户ID
     * @returns 是否已过期
     */
    static async checkAndExpireQuote(quoteId: string, tenantId: string): Promise<{ expired: boolean; expiredAt?: Date }> {
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId))
        });

        if (!quote) throw new Error('Quote not found');

        // 如果已是 EXPIRED 状态，直接返回
        if (quote.status === 'EXPIRED') {
            return { expired: true, expiredAt: quote.updatedAt ?? undefined };
        }

        // 检查是否需要过期（validUntil 已过期且状态不是已确认/已拒绝）
        const now = new Date();
        const validUntil = quote.validUntil;
        const canExpire = quote.status === 'DRAFT' || quote.status === 'PENDING_APPROVAL' || quote.status === 'PENDING_CUSTOMER';

        if (validUntil && validUntil < now && canExpire) {
            // 更新状态为 EXPIRED
            await db.update(quotes)
                .set({
                    status: 'EXPIRED',
                    updatedAt: now
                })
                .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

            return { expired: true, expiredAt: now };
        }

        return { expired: false };
    }

    /**
     * 批量过期处理 (Batch Expire Overdue Quotes)
     * 用于定时任务/Cron Job，批量处理所有过期报价
     * 
     * @param tenantId - 可选，限定租户范围
     * @returns 处理结果统计
     */
    static async expireAllOverdueQuotes(tenantId?: string): Promise<{ processed: number; expired: number }> {
        // const { lt, inArray } = await import('drizzle-orm'); // Removed dynamic import


        const now = new Date();

        // 构建查询条件
        const conditions = [
            lt(quotes.validUntil, now),
            inArray(quotes.status, ['DRAFT', 'PENDING_APPROVAL', 'PENDING_CUSTOMER'])
        ];

        if (tenantId) {
            conditions.push(eq(quotes.tenantId, tenantId));
        }

        // 查找所有过期报价
        const overdueQuotes = await db.query.quotes.findMany({
            where: and(...conditions),
            columns: { id: true }
        });

        if (overdueQuotes.length === 0) {
            return { processed: 0, expired: 0 };
        }

        const quoteIds = overdueQuotes.map(q => q.id);

        // 批量更新状态
        await db.update(quotes)
            .set({
                status: 'EXPIRED',
                updatedAt: now
            })
            .where(inArray(quotes.id, quoteIds));

        return { processed: quoteIds.length, expired: quoteIds.length };
    }

    /**
     * 刷新过期报价价格 (Refresh Expired Quote Prices)
     * 当客户重新确认过期报价时，刷新所有商品价格为最新价格
     * 
     * @param quoteId - 报价ID
     * @param tenantId - 租户ID
     * @param newValidDays - 新的有效期天数（默认7天）
     * @returns 刷新后的报价
     */
    static async refreshExpiredQuotePrices(
        quoteId: string,
        tenantId: string,
        newValidDays: number = 7
    ): Promise<{
        success: boolean;
        updatedItems: number;
        priceChanges: { itemId: string; oldPrice: number; newPrice: number }[];
        newValidUntil: Date;
    }> {
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
            with: { items: true }
        });



        if (!quote) throw new Error('Quote not found');

        // 仅允许 EXPIRED 或 DRAFT 状态的报价刷新价格
        if (quote.status !== 'EXPIRED' && quote.status !== 'DRAFT') {
            throw new Error('只有已过期或草稿状态的报价可以刷新价格');
        }

        const { products: productsSchema } = await import('@/shared/api/schema/catalogs'); // Renamed to avoid confusion

        const itemIds = quote.items
            .filter(item => item.productId)
            .map(item => item.productId as string);

        if (itemIds.length === 0) {
            return { success: true, updatedItems: 0, priceChanges: [], newValidUntil: new Date() };
        }

        // P1-02 优化：批量查询商品价格，避免 N+1 查询
        const productsList = await db.query.products.findMany({
            where: and(inArray(productsSchema.id, itemIds), eq(productsSchema.tenantId, tenantId)),
            columns: { id: true, retailPrice: true }
        });

        const productPriceMap = new Map(productsList.map(p => [p.id, Number(p.retailPrice)]));
        const priceChanges: { itemId: string; oldPrice: number; newPrice: number }[] = [];
        let updatedItems = 0;

        // 🔒 P1-R4-03 修复：所有操作在同一事务内执行，确保原子性
        await db.transaction(async (tx) => {
            for (const item of quote.items) {
                if (!item.productId) continue;

                const newPrice = productPriceMap.get(item.productId);
                if (newPrice === undefined) continue;

                const oldPrice = Number(item.unitPrice);

                // 如果价格有变化，更新报价项
                if (Math.abs(oldPrice - newPrice) > 0.01) {
                    // P1-05 修复：使用整数运算避免浮点精度问题
                    const newSubtotal = Math.round(newPrice * Number(item.quantity) * 100) / 100;

                    await tx.update(quoteItems)
                        .set({
                            unitPrice: newPrice.toFixed(2),
                            subtotal: newSubtotal.toFixed(2),
                            updatedAt: new Date()
                        })
                        .where(and(eq(quoteItems.id, item.id), eq(quoteItems.tenantId, tenantId)));

                    priceChanges.push({
                        itemId: item.id,
                        oldPrice,
                        newPrice
                    });
                    updatedItems++;
                }
            }

            // ✅ 移入事务：重新计算总额
            const updatedItemsList = await tx.query.quoteItems.findMany({
                where: and(eq(quoteItems.quoteId, quoteId), eq(quoteItems.tenantId, tenantId)),
            });
            const totalDec = updatedItemsList.reduce(
                (acc, item) => acc.plus(new Decimal(item.subtotal || 0)),
                new Decimal(0)
            );

            // ✅ 移入事务：计算新的有效期并更新状态
            const newValidUntil = new Date();
            newValidUntil.setDate(newValidUntil.getDate() + newValidDays);

            await tx.update(quotes)
                .set({
                    totalAmount: totalDec.toFixed(2),
                    finalAmount: totalDec.toFixed(2),
                    status: 'DRAFT',
                    validUntil: newValidUntil,
                    updatedAt: new Date()
                })
                .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));
        });

        const newValidUntil = new Date();
        newValidUntil.setDate(newValidUntil.getDate() + newValidDays);

        return {
            success: true,
            updatedItems,
            priceChanges,
            newValidUntil
        };
    }

    /**
     * 获取报价过期状态信息 (Get Quote Expiration Info)
     * 
     * @param quoteId - 报价ID
     * @param tenantId - 租户ID
     * @returns 过期状态详情
     */
    static async getExpirationInfo(quoteId: string, tenantId: string): Promise<{
        isExpired: boolean;
        validUntil: Date | null;
        daysUntilExpiry: number | null;
        status: string;
    }> {
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
            columns: {
                status: true,
                validUntil: true
            }
        });

        if (!quote) throw new Error('Quote not found');

        const now = new Date();
        const validUntil = quote.validUntil;

        let daysUntilExpiry: number | null = null;
        let isExpired = quote.status === 'EXPIRED';

        if (validUntil) {
            const diffMs = validUntil.getTime() - now.getTime();
            daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0 && (quote.status === 'DRAFT' || quote.status === 'PENDING_APPROVAL' || quote.status === 'PENDING_CUSTOMER')) {
                isExpired = true;
            }
        }

        return {
            isExpired,
            validUntil,
            daysUntilExpiry,
            status: quote.status ?? 'DRAFT'
        };
    }
}

