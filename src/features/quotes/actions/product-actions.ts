'use server';

import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema/catalogs';
import { ilike, or, and, eq } from 'drizzle-orm';

export interface ProductSearchResult {
    id: string;
    name: string;
    sku: string;
    category: string;
    unitPrice: string | null;
    unit: string | null;
    specs: Record<string, unknown>;
    images?: string[];
}

export async function searchProducts(query: string, category?: string): Promise<ProductSearchResult[]> {
    if (!query && !category) return [];
    // Allow searching with at least 1 character for flexibility
    if (query && query.length < 1) return [];

    const term = `%${query.trim()}%`;
    const conditions = [
        or(
            ilike(products.name, term),
            ilike(products.sku, term)
        )
    ];

    if (category) {
        conditions.push(eq(products.category, category as any)); // productCategoryEnum can be tricky with string input
    }

    const results = await db.query.products.findMany({
        where: and(...conditions),
        limit: 10,
        columns: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unitPrice: true,
            unit: true,
            specs: true,
            images: true,
        }
    });

    return results as ProductSearchResult[];
}
