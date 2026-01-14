import { productCategoryEnum } from '@/shared/api/schema';

export type { ProductCategory } from '@/shared/api/schema';

export type Product = {
    id: string;
    tenantId: string;
    sku: string;
    name: string;
    category: (typeof productCategoryEnum.enumValues)[number];
    unit: string;
    basePrice: string;
    costPrice?: string | null;
    defaultSupplierId?: string | null;
    isStockable: boolean;
    stockQuantity: string;
    safetyStock?: string | null;
    images: string[];
    attributes: Record<string, unknown>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
};

export type ProductListResponse = {
    data: Product[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type ProductDetailResponse = {
    product: Product & {
        defaultSupplier?: {
            id: string;
            name: string;
        } | null;
    };
    logs: Array<{
        id: string;
        action: string;
        operatorId: string;
        details: Record<string, unknown>;
        createdAt: Date;
    }>;
};

export * from './actions';
export * from './schema';
