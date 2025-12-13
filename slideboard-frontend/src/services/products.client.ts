import { supabase } from '@/lib/supabase/client';
import { Product, CreateProductRequest, UpdateProductRequest, ProductStatus, ProductPrices, ProductImages, ProductTags, ProductFilter } from '@/shared/types/product';
import { Database } from '@/shared/types/supabase';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

function mapDbToProduct(row: ProductRow): Product {
    return {
        id: row.id,
        productCode: row.product_code,
        productName: row.product_name,
        categoryLevel1: row.category_level1 || '',
        categoryLevel2: row.category_level2 || '',
        unit: row.unit,
        status: row.status as ProductStatus,
        prices: (row.prices as unknown as ProductPrices) || { 
            costPrice: 0, 
            internalCostPrice: 0, 
            internalSettlementPrice: 0, 
            settlementPrice: 0, 
            retailPrice: 0 
        },
        attributes: (row.attributes as unknown as Record<string, string>) || {},
        images: (row.images as unknown as ProductImages) || { 
            detailImages: [], 
            effectImages: [], 
            caseImages: [] 
        },
        tags: (row.tags as unknown as ProductTags) || { 
            styleTags: [], 
            packageTags: [], 
            activityTags: [], 
            seasonTags: [], 
            demographicTags: [] 
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export const productsService = {
    // 获取所有商品
    async getAllProducts(filter?: ProductFilter): Promise<Product[]> {
        // 暂时移除分类字段查询，避免报错
        let query = supabase
            .from('products')
            .select(`
                id, product_code, product_name, 
                unit, status, prices, attributes, images, tags,
                created_at, updated_at
            `);

        if (filter) {
            if (filter.searchTerm) {
                query = query.or(`product_name.ilike.%${filter.searchTerm}%,product_code.ilike.%${filter.searchTerm}%`);
            }
            // 暂时移除分类筛选
            // if (filter.categoryLevel1 && filter.categoryLevel1 !== 'all') {
            //    query = query.eq('category_level1', filter.categoryLevel1);
            // }
            // if (filter.categoryLevel2 && filter.categoryLevel2 !== 'all') {
            //    query = query.eq('category_level2', filter.categoryLevel2);
            // }
            if (filter.status && filter.status !== 'all') {
                query = query.eq('status', filter.status);
            }
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        return (data || []).map(mapDbToProduct);
    },

    // 获取单个商品
    async getProductById(id: string): Promise<Product | null> {
        // 暂时移除分类字段查询，避免报错
        const { data, error } = await supabase
            .from('products')
            .select(`
                id, product_code, product_name, 
                unit, status, prices, attributes, images, tags,
                created_at, updated_at
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(error.message);
        }

        return mapDbToProduct(data);
    },

    // 创建商品
    async createProduct(productData: CreateProductRequest): Promise<Product> {
        const dbData: ProductInsert = {
            product_code: productData.productCode,
            product_name: productData.productName,
            category_level1: productData.categoryLevel1,
            category_level2: productData.categoryLevel2,
            unit: productData.unit,
            status: productData.status,
            prices: productData.prices as unknown as any, // Cast to any/Json for Supabase
            attributes: productData.attributes as unknown as any,
            images: productData.images as unknown as any,
            tags: productData.tags as unknown as any,
        };

        const { data, error } = await supabase
            .from('products')
            .insert(dbData)
            .select()
            .single();

        if (error) throw new Error(error.message);

        return mapDbToProduct(data);
    },

    // 更新商品
    async updateProduct(id: string, productData: UpdateProductRequest): Promise<Product> {
        const dbData: ProductUpdate = {};
        if (productData.productCode) dbData.product_code = productData.productCode;
        if (productData.productName) dbData.product_name = productData.productName;
        if (productData.categoryLevel1) dbData.category_level1 = productData.categoryLevel1;
        if (productData.categoryLevel2) dbData.category_level2 = productData.categoryLevel2;
        if (productData.unit) dbData.unit = productData.unit;
        if (productData.status) dbData.status = productData.status;
        if (productData.prices) dbData.prices = productData.prices as unknown as any;
        if (productData.attributes) dbData.attributes = productData.attributes as unknown as any;
        if (productData.images) dbData.images = productData.images as unknown as any;
        if (productData.tags) dbData.tags = productData.tags as unknown as any;
        
        dbData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('products')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        return mapDbToProduct(data);
    },

    // 删除商品
    async deleteProduct(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);

        return true;
    },

    // 获取商品分类
    async getProductCategories() {
        return [
            { value: 'all', label: '全部分类' },
            { value: '窗帘', label: '窗帘' },
            { value: '墙布', label: '墙布' },
            { value: '墙咔', label: '墙咔' },
            { value: '飘窗垫', label: '飘窗垫' },
            { value: '标品', label: '标品' },
            { value: '礼品', label: '礼品' },
            { value: '销售道具', label: '销售道具' }
        ];
    },
};
