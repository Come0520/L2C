'use server';

import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema/catalogs';
import { ilike, or, and, eq, inArray } from 'drizzle-orm';
import type { ProductCategory } from '@/shared/api/schema/types';
import { matchesPinyin } from '@/features/quotes/utils/pinyin-search';
import { auth } from '@/shared/lib/auth';

export interface ProductSearchResult {
    id: string;
    name: string;
    sku: string;
    category: string;
    unitPrice: string | null;
    retailPrice: string | null;
    unit: string | null;
    specs: Record<string, unknown>;
    images?: string[];
}

/**
 * 商品搜索函数 (Search Products)
 * 基于租户隔离检索商品，支持：
 * 1. 中文模糊匹配、拼音首字母搜索、完整拼音搜索（利用 Pinyin 库）。
 * 2. 多级过滤：单一品类或多品类集合（allowedCategories 优先）。
 * 3. 智能权重：最近使用的商品 (recentProductIds) 自动置顶。
 * 
 * @param query - 搜索词（支持中文、拼音首字母、完整拼音）
 * @param category - 商品品类筛选（单一品类，如 'CURTAIN'）
 * @param recentProductIds - 最近使用的商品 ID 列表，用于权重排序
 * @param allowedCategories - 允许的品类列表（数组形式，用于更复杂的过滤逻辑）
 * @returns 经过权重排序和截断后的搜索结果列表（最多 15 条）
 */
export async function searchProducts(
    query: string,
    category?: string,
    recentProductIds?: string[],
    allowedCategories?: string[]
): Promise<ProductSearchResult[]> {
    // 🔒 安全校验：添加认证和租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
        return []; // 未授权返回空结果
    }
    const tenantId = session.user.tenantId;

    const hasQuery = query && query.trim().length > 0;
    const normalizedQuery = query?.trim().toLowerCase() || '';

    // 判断是否为纯拼音/英文搜索（用于决定是否使用客户端拼音匹配）
    const isPinyinQuery = /^[a-zA-Z]+$/.test(normalizedQuery);

    const conditions = [];

    // 🔒 租户隔离：只返回当前租户的商品
    conditions.push(eq(products.tenantId, tenantId));

    // 如果有搜索词且不是纯拼音，使用数据库模糊匹配
    if (hasQuery && !isPinyinQuery) {
        const term = `%${normalizedQuery}%`;
        conditions.push(
            or(
                ilike(products.name, term),
                ilike(products.sku, term)
            )
        );
    }

    // 品类过滤：优先使用 allowedCategories，否则回退到 category
    if (allowedCategories && allowedCategories.length > 0) {
        // 使用 inArray 进行多品类过滤
        conditions.push(inArray(products.category, allowedCategories as ProductCategory[]));
    } else if (category) {
        conditions.push(eq(products.category, category as ProductCategory));
    }

    // 获取候选商品（拼音搜索时获取更多候选）
    const limit = isPinyinQuery ? 100 : 20;

    let results = await db.query.products.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit,
        orderBy: (products, { desc }) => [desc(products.updatedAt)],
        columns: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unitPrice: true,
            retailPrice: true,
            unit: true,
            specs: true,
            images: true,
        }
    }) as ProductSearchResult[];

    // 如果是拼音搜索，在服务端进行拼音匹配过滤
    if (isPinyinQuery && hasQuery) {
        results = results.filter(product =>
            matchesPinyin(product.name, normalizedQuery) ||
            product.sku.toLowerCase().includes(normalizedQuery)
        );
    }

    // 智能排序：最近使用的商品优先
    if (recentProductIds && recentProductIds.length > 0) {
        const recentSet = new Set(recentProductIds);
        const recentIndexMap = new Map(recentProductIds.map((id, idx) => [id, idx]));

        results.sort((a, b) => {
            const aIsRecent = recentSet.has(a.id);
            const bIsRecent = recentSet.has(b.id);

            if (aIsRecent && !bIsRecent) return -1;
            if (!aIsRecent && bIsRecent) return 1;
            if (aIsRecent && bIsRecent) {
                return (recentIndexMap.get(a.id) || 0) - (recentIndexMap.get(b.id) || 0);
            }
            return 0;
        });
    }

    // 返回最多15条结果
    return results.slice(0, 15);
}
