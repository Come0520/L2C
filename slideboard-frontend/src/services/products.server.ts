import { createClient } from '@/lib/supabase/server'
import { Product, ProductStatus, ProductPrices, ProductImages, ProductTags, ProductFilter } from '@/shared/types/product'
import { Database } from '@/shared/types/supabase'

type ProductRow = Database['public']['Tables']['products']['Row']

export async function getAllProducts(filter?: ProductFilter): Promise<Product[]> {
    const supabase = await createClient()
    
    let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

    if (filter) {
        if (filter.searchTerm) {
            query = query.or(`product_name.ilike.%${filter.searchTerm}%,product_code.ilike.%${filter.searchTerm}%`)
        }
        // 暂时移除分类筛选，因为数据库结构变更导致 category_level1 列不存在
        // if (filter.categoryLevel1 && filter.categoryLevel1 !== 'all') {
        //    query = query.eq('category_level1', filter.categoryLevel1)
        // }
        // if (filter.categoryLevel2 && filter.categoryLevel2 !== 'all') {
        //    query = query.eq('category_level2', filter.categoryLevel2)
        // }
        if (filter.status && filter.status !== 'all') {
            query = query.eq('status', filter.status)
        }
    }

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return (data || []).map(mapDbToProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
    }

    return mapDbToProduct(data)
}

export async function getProductCategories() {
    return [
        { value: 'all', label: '全部分类' },
        { value: '窗帘', label: '窗帘' },
        { value: '墙布', label: '墙布' },
        { value: '墙咔', label: '墙咔' },
        { value: '飘窗垫', label: '飘窗垫' },
        { value: '标品', label: '标品' },
        { value: '礼品', label: '礼品' },
        { value: '销售道具', label: '销售道具' }
    ]
}

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
    }
}