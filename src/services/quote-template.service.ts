import { db } from "@/shared/api/db";
import {
    quoteTemplates,
    quoteTemplateRooms,
    quoteTemplateItems,
    quotes,
    quoteRooms,
    quoteItems
} from "@/shared/api/schema/quotes";
import { eq } from "drizzle-orm";

/**
 * 报价模板服务
 * 提供模板的创建、查询、复制等核心功能
 */
export class QuoteTemplateService {

    /**
     * 从现有报价保存为模板
     * 
     * @param quoteId - 源报价ID
     * @param name - 模板名称
     * @param description - 模板描述
     * @param userId - 创建者ID
     * @param options - 附加选项（分类、标签、是否公开）
     */
    static async saveAsTemplate(
        quoteId: string,
        name: string,
        description: string | undefined,
        userId: string,
        options: {
            category?: string;
            tags?: string[];
            isPublic?: boolean;
        } = {}
    ) {
        return await db.transaction(async (tx) => {
            // 1. 获取源报价及其空间和商品
            const quote = await tx.query.quotes.findFirst({
                where: eq(quotes.id, quoteId),
                with: {
                    rooms: true,
                    items: true
                }
            });

            if (!quote) throw new Error("报价单不存在");

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
            const sortedItems = [...quote.items].sort((a, b) => {
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
     * 从模板创建报价
     * 
     * @param templateId - 模板ID
     * @param customerId - 目标客户ID
     * @param userId - 创建者ID
     */
    static async createQuoteFromTemplate(
        templateId: string,
        customerId: string,
        userId: string
    ) {
        return await db.transaction(async (tx) => {
            // 1. 获取模板及其空间和商品
            const template = await tx.query.quoteTemplates.findFirst({
                where: eq(quoteTemplates.id, templateId),
                with: {
                    rooms: true,
                    items: true
                }
            });

            if (!template) throw new Error("模板不存在");

            // 2. 生成新报价单号
            const quoteNo = `QT${Date.now()}`;

            // 3. 创建报价主记录
            const [newQuote] = await tx.insert(quotes).values({
                tenantId: template.tenantId,
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
                    tenantId: template.tenantId,
                    quoteId: newQuote.id,
                    name: room.name,
                    sortOrder: room.sortOrder,
                    createdAt: new Date()
                }).returning();
                roomIdMap.set(room.id, newRoom.id);
            }

            // 5. 复制商品项（先根项，再附件）
            const itemIdMap = new Map<string, string>();
            const sortedItems = [...template.items].sort((a, b) => {
                if (!a.parentId && b.parentId) return -1;
                if (a.parentId && !b.parentId) return 1;
                return 0;
            });

            for (const item of sortedItems) {
                const [newItem] = await tx.insert(quoteItems).values({
                    tenantId: template.tenantId,
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
                    quantity: '0', // 需要根据实际尺寸计算
                    subtotal: '0', // 需要重新计算
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
     * 获取模板列表
     */
    static async getTemplates(
        tenantId: string,
        options: {
            category?: string;
            search?: string;
            includePublic?: boolean;
            userId?: string;
            limit?: number;
            offset?: number;
        } = {}
    ) {
        const { and, or, ilike, sql } = await import('drizzle-orm');

        const conditions = [
            eq(quoteTemplates.tenantId, tenantId),
            eq(quoteTemplates.isActive, true)
        ];

        if (options.category) {
            conditions.push(eq(quoteTemplates.category, options.category));
        }

        if (options.search) {
            conditions.push(
                or(
                    ilike(quoteTemplates.name, `%${options.search}%`),
                    ilike(quoteTemplates.description, `%${options.search}%`)
                ) as typeof conditions[0]
            );
        }

        // 如果指定用户，只返回该用户的私有模板或公开模板
        if (options.userId && !options.includePublic) {
            conditions.push(
                or(
                    eq(quoteTemplates.createdBy, options.userId),
                    eq(quoteTemplates.isPublic, true)
                ) as typeof conditions[0]
            );
        }

        const templates = await db.query.quoteTemplates.findMany({
            where: and(...conditions),
            with: {
                creator: {
                    columns: { id: true, name: true }
                },
                rooms: {
                    columns: { id: true, name: true }
                }
            },
            orderBy: (t, { desc }) => [desc(t.createdAt)],
            limit: options.limit || 20,
            offset: options.offset || 0
        });

        // 获取每个模板的商品数量
        const templatesWithCount = await Promise.all(
            templates.map(async (template) => {
                const itemCount = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(quoteTemplateItems)
                    .where(eq(quoteTemplateItems.templateId, template.id));

                return {
                    ...template,
                    itemCount: Number(itemCount[0]?.count || 0),
                    roomCount: template.rooms.length
                };
            })
        );

        return templatesWithCount;
    }

    /**
     * 获取单个模板详情
     */
    static async getTemplate(templateId: string) {
        return await db.query.quoteTemplates.findFirst({
            where: eq(quoteTemplates.id, templateId),
            with: {
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
     * 删除模板（软删除）
     */
    static async deleteTemplate(templateId: string) {
        await db.update(quoteTemplates)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(quoteTemplates.id, templateId));

        return { success: true };
    }

    /**
     * 根据商品类型推断模板分类
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
