import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/shared/types/supabase';
import { fromDbFields, toDbFields } from '@/utils/db-mapping';

type ProductRow = Database['public']['Tables']['products']['Row'];
// type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

// 商品类型定义
export interface Product {
    id: string;
    productCode: string;
    productName: string;
    categoryLevel1: string;
    categoryLevel2: string;
    unit: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'online' | 'offline';
    prices: {
        costPrice: number;
        internalCostPrice: number;
        internalSettlementPrice: number;
        settlementPrice: number;
        retailPrice: number;
    };
    images: {
        detailImages: string[];
        effectImages: string[];
        caseImages: string[];
    };
    createdAt: string;
    updatedAt: string;
}

// 数据库字段映射工具函数
function mapDbToProduct(item: ProductRow): Product {
    // 1. 自动映射基础字段
    const base = fromDbFields<Partial<Product>>(item, {
        category_level1_id: 'categoryLevel1',
        category_level2_id: 'categoryLevel2',
        // 忽略价格字段，后续手动处理
        cost_price: null,
        internal_cost_price: null,
        internal_settlement_price: null,
        settlement_price: null,
        retail_price: null,
        // images 字段虽然名字一样，但需要处理默认值
        images: null
    });

    // 2. 手动组装复杂结构
    return {
        ...base,
        prices: {
            costPrice: item.cost_price,
            internalCostPrice: item.internal_cost_price,
            internalSettlementPrice: item.internal_settlement_price,
            settlementPrice: item.settlement_price,
            retailPrice: item.retail_price,
        },
        images: {
            detailImages: item.images?.detailImages || [],
            effectImages: item.images?.effectImages || [],
            caseImages: item.images?.caseImages || [],
        },
    } as Product;
}

function mapProductToDb(productData: Partial<Product>): Partial<ProductUpdate> {
    // 1. 自动映射基础字段
    const dbData = toDbFields(productData, {
        categoryLevel1: 'category_level1_id',
        categoryLevel2: 'category_level2_id',
        // 忽略复杂对象，手动处理
        prices: null,
        images: null // 手动赋值以确保正确
    });

    // 2. 手动处理价格字段 (打平)
    if (productData.prices) {
        const priceMap = toDbFields(productData.prices);
        Object.assign(dbData, priceMap);
    }

    // 3. 手动处理图片
    if (productData.images) {
        dbData.images = productData.images;
    }

    return dbData;
}

// 商品API服务 (Supabase 版本)
export const productsService = {
    // 获取所有商品
    async getAllProducts(): Promise<Product[]> {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 映射数据库字段到前端类型
            return (data || []).map(mapDbToProduct);
        });
    },

    // 获取单个商品
    async getProductById(id: string): Promise<Product | null> {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return mapDbToProduct(data);
        });
    },

    // 创建商品
    async createProduct(productData: Partial<Product>): Promise<Product | null> {
        return withErrorHandler(async () => {
            const supabase = createClient();

            // 转换前端驼峰命名到数据库蛇形命名
            const dbData = mapProductToDb(productData);

            const { data, error } = await supabase
                .from('products')
                .insert([dbData])
                .select()
                .single();

            if (error) throw error;

            return mapDbToProduct(data);
        });
    },

    // 更新商品
    async updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
        return withErrorHandler(async () => {
            const supabase = createClient();

            const dbData = mapProductToDb(productData);

            const { data, error } = await supabase
                .from('products')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return mapDbToProduct(data);
        });
    },

    // 删除商品
    async deleteProduct(id: string): Promise<boolean> {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return true;
        });
    },

    // 获取商品分类
    async getProductCategories() {
        // 暂时返回静态数据，后续可迁移至数据库字典表
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
