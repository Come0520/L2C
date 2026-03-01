import { db } from "@/shared/api/db";
import {
    quoteTemplates,
    quoteTemplateRooms,
    quoteTemplateItems,
    quotes,
    quoteRooms,
    quoteItems
} from "@/shared/api/schema/quotes";
import { eq, or, and, ne, desc } from "drizzle-orm";

/**
 * 报价模板服务 (Quote Template Service)
 * 提供模板的创建、查询、应用等核心功能。
 * 明细模板支持公共模板（租户列表）和私有模板（租户专属）两种范围。
 */
export class QuoteTemplateService {

    /**
     * 将报价单保存为模板 (Save As Template)
     * 将现有报价单的空间和商品明细复制到模板表中，平键为可平衣的模板。
     * 支持设置分类、标签和公开范围。
     *
     * @param quoteId - 源报价 ID
     * @param name - 模板名称
     * @param description - 模板描述
     * @param userId - 创建者 ID
     * @param tenantId - 租户 ID
     * @param options.category - 模板分类（可选）
     * @param options.tags - 模板标签列表（可选）
     * @param options.isPublic - 是否公开到租户分享列表（可选）
     * @returns 新创建的模板对象
     * @throws Error 源报价不存在时抛出
     * @security 🔒 租户隔离 + 事务包裹
     */
    static async saveAsTemplate(
        quoteId: string,
        name: string,
        description: string | undefined,
        userId: string,
        tenantId: string,
        options: {
            category?: string;
            tags?: string[];
            isPublic?: boolean;
        } = {}
    ) {
        return await db.transaction(async (tx) => {
            // 1. 获取源报价及其空间和商品 (🔒 安全校验：验证租户归属)
            const quote = await tx.query.quotes.findFirst({
                where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
                with: {
                    rooms: true,
                    items: true
                }
            });

            if (!quote) throw new Error("报价单不存在或无权操作");

            // 2. 创建模板主记录
            const [template] = await tx.insert(quoteTemplates).values({
                tenantId: quote.tenantId,
                name,
                description,
                category: options.category || this.inferCategory(quote.items),
                tags: options.tags || [],
                sourceQuoteId: quote.id,
                isPublic: options.isPublic || false,
                isActive: true,
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            // ... (rest is same, skipped for brevity in tool call if possible, but replace_file_content needs full block? No, I can replace the function start)
            // Wait, I need to replace the WHOLE function or start/end.
            // I'll replace the block I can see in the previous view efficiently.

            // 3. 复制空间并建立 ID 映射
            const roomIdMap = new Map<string, string>();
            for (const room of quote.rooms) {
                const [newRoom] = await tx.insert(quoteTemplateRooms).values({
                    tenantId: quote.tenantId,
                    templateId: template.id,
                    name: room.name,
                    sortOrder: room.sortOrder,
                    createdAt: new Date()
                }).returning();
                roomIdMap.set(room.id, newRoom.id);
            }

            // 4. 复制商品项（先根项，再附件）
            const itemIdMap = new Map<string, string>();
            const sortedItems = quote.items.toSorted((a, b) => {
                if (!a.parentId && b.parentId) return -1;
                if (a.parentId && !b.parentId) return 1;
                return 0;
            });

            for (const item of sortedItems) {
                const [newItem] = await tx.insert(quoteTemplateItems).values({
                    tenantId: quote.tenantId,
                    templateId: template.id,
                    roomId: item.roomId ? roomIdMap.get(item.roomId) : null,
                    parentId: item.parentId ? itemIdMap.get(item.parentId) : null,
                    category: item.category,
                    productId: item.productId,
                    productName: item.productName,
                    defaultWidth: item.width,
                    defaultHeight: item.height,
                    defaultFoldRatio: item.foldRatio,
                    unitPrice: item.unitPrice,
                    attributes: item.attributes || {},
                    sortOrder: item.sortOrder,
                    createdAt: new Date()
                }).returning();
                itemIdMap.set(item.id, newItem.id);
            }

            return template;
        });
    }

    /**
     * 从模板创建报价单 (Create Quote From Template)
     * 将模板的空间和商品项全量复制到新报价单中。
     * 新报价单状态为 DRAFT，数量和尺寸可在创建后进一步编辑。
     *
     * @param templateId - 模板 ID
     * @param customerId - 目标客户 ID
     * @param userId - 创建者 ID
     * @param tenantId - 租户 ID
     * @returns 新创建的报价单对象
     * @throws Error 模板不存在时抛出
     * @security 🔒 租户隔离 + 事务包裹
     */
    static async createQuoteFromTemplate(
        templateId: string,
        customerId: string,
        userId: string,
        tenantId: string
    ) {


        return await db.transaction(async (tx) => {
            // 1. 获取模板及其空间和商品 (🔒 安全校验：验证租户归属或公开模板)
            const template = await tx.query.quoteTemplates.findFirst({
                where: and(
                    eq(quoteTemplates.id, templateId),
                    or(
                        eq(quoteTemplates.tenantId, tenantId),
                        eq(quoteTemplates.isPublic, true)
                    )
                ),
                with: {
                    rooms: true,
                    items: true
                }
            });

            if (!template) throw new Error("模板不存在或无权访问");

            // ... (rest of logic)
            // 2. 生成新报价单号
            const quoteNo = `QT${Date.now()}`;

            // 3. 创建报价主记录
            const [newQuote] = await tx.insert(quotes).values({
                tenantId: tenantId, // Use current tenantId
                customerId,
                quoteNo,
                version: 1,
                totalAmount: '0',
                finalAmount: '0',
                discountAmount: '0',
                status: 'DRAFT',
                isActive: true,
                createdBy: userId,
                notes: `从模板创建: ${template.name}`,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            // 设置 rootQuoteId 为自身
            await tx.update(quotes)
                .set({ rootQuoteId: newQuote.id })
                .where(eq(quotes.id, newQuote.id));

            // 4. 复制空间
            const roomIdMap = new Map<string, string>();
            for (const room of template.rooms) {
                const [newRoom] = await tx.insert(quoteRooms).values({
                    tenantId: tenantId, // Use current tenantId
                    quoteId: newQuote.id,
                    name: room.name,
                    sortOrder: room.sortOrder,
                    createdAt: new Date()
                }).returning();
                roomIdMap.set(room.id, newRoom.id);
            }

            // 5. 复制商品项（先根项，再附件）
            const itemIdMap = new Map<string, string>();
            const sortedItems = template.items.toSorted((a, b) => {
                if (!a.parentId && b.parentId) return -1;
                if (a.parentId && !b.parentId) return 1;
                return 0;
            });

            for (const item of sortedItems) {
                const [newItem] = await tx.insert(quoteItems).values({
                    tenantId: tenantId, // Use current tenantId
                    quoteId: newQuote.id,
                    roomId: item.roomId ? roomIdMap.get(item.roomId) : null,
                    parentId: item.parentId ? itemIdMap.get(item.parentId) : null,
                    category: item.category,
                    productId: item.productId,
                    productName: item.productName,
                    width: item.defaultWidth,
                    height: item.defaultHeight,
                    foldRatio: item.defaultFoldRatio,
                    unitPrice: item.unitPrice?.toString() || '0',
                    quantity: '1', // P2-R4-02: 默认数量 1，用户后续可修改
                    subtotal: item.unitPrice?.toString() || '0', // 基于单价 × 默认数量
                    attributes: item.attributes || {},
                    sortOrder: item.sortOrder,
                    createdAt: new Date()
                }).returning();
                itemIdMap.set(item.id, newItem.id);
            }

            return { ...newQuote, rootQuoteId: newQuote.id };
        });
    }

    /**
     * 查询模板列表 (Get Templates)
     * 支持按分类和排除某模板过滤。公开模板和当前租户的私有模板均包含在结果中。
     *
     * @param tenantId - 租户 ID
     * @param options.excludeId - 要排除的模板 ID（防止自引用）
     * @param options.category - 按分类过滤（可选）
     * @returns 模板列表，按创建时间倒序
     * @security 🔒 租户隔离
     */
    static async getTemplates(tenantId: string, options: { excludeId?: string; category?: string } = {}) {
        const rules = [
            or(eq(quoteTemplates.tenantId, tenantId), eq(quoteTemplates.isPublic, true)),
            eq(quoteTemplates.isActive, true)
        ];

        if (options.excludeId) {
            rules.push(ne(quoteTemplates.id, options.excludeId));
        }

        if (options.category && options.category !== 'ALL') {
            rules.push(eq(quoteTemplates.category, options.category));
        }

        const templates = await db.query.quoteTemplates.findMany({
            where: and(...rules),
            orderBy: [desc(quoteTemplates.updatedAt)],
            with: {
                creator: {
                    columns: { id: true, name: true }
                },
                items: {
                    columns: { category: true }
                },
                rooms: {
                    columns: { id: true }
                }
            }
        });

        // Get unique categories for filter
        const allCats = new Set(templates.map(t => t.category).filter(Boolean));

        return {
            templates,
            categories: Array.from(allCats)
        };
    }

    /**
     * 获取单个模板详情 (Get Template)
     * 查询指定模板的完整信息，包含空间列表和商品明细项。
     *
     * @param templateId - 模板 ID
     * @param tenantId - 租户 ID
     * @returns 模板详情对象（含 rooms/items），不存在则返回 `undefined`
     * @security 🔒 租户隔离
     */
    static async getTemplate(templateId: string, tenantId: string) {

        return await db.query.quoteTemplates.findFirst({
            where: and(
                eq(quoteTemplates.id, templateId),
                or(
                    eq(quoteTemplates.tenantId, tenantId),
                    eq(quoteTemplates.isPublic, true)
                )
            ),
            with: {
                // ...
                creator: {
                    columns: { id: true, name: true }
                },
                rooms: true,
                items: {
                    with: {
                        product: {
                            columns: { id: true, name: true, retailPrice: true }
                        }
                    }
                }
            }
        });
    }

    /**
     * 删除模板（软删除） (Delete Template)
     * 将模板的 `isActive` 设为 `false`，不的实际删除数据库记录。
     * 软删除后模板不再出现在列表中。
     *
     * @param templateId - 模板 ID
     * @param tenantId - 租户 ID
     * @throws Error 模板不存在时抛出
     * @security 🔒 租户隔离
     */
    static async deleteTemplate(templateId: string, tenantId: string) {
        // 🔒 安全校验：验证租户归属
        const [updated] = await db.update(quoteTemplates)
            .set({ isActive: false, updatedAt: new Date() })
            .where(
                and(
                    eq(quoteTemplates.id, templateId),
                    eq(quoteTemplates.tenantId, tenantId)
                )
            )
            .returning({ id: quoteTemplates.id });

        if (!updated) throw new Error("模板不存在或无权操作");

        return { success: true };
    }

    /**
     * 根据商品类型推断模板分类 (Infer Category)
     * 分析报价项中的主要商品类型，推断该模板应归属的分类（如 CURTAIN 、WALLPAPER 等）。
     *
     * @param items - 报价项数组（至少有 category 字段）
     * @returns 推断得到的模板分类字符串，无法判断则返回 `'MIXED'`
     */
    private static inferCategory(items: { category: string }[]): string {
        const categories = new Set(items.map(i => i.category));

        if (categories.size === 0) return 'MIXED';
        if (categories.size === 1) {
            const cat = [...categories][0];
            if (cat.includes('CURTAIN') || cat.includes('TRACK')) return 'CURTAIN';
            if (cat.includes('WALLPAPER') || cat.includes('WALLCLOTH')) return 'WALLPAPER';
        }

        return 'MIXED';
    }
}
