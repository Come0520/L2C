import { z } from 'zod';
import { productCategoryEnum } from '@/shared/api/schema/enums';

/**
 * 产品属性 Schema (JSONB 存储)
 */
export const wallpaperAttributesSchema = z.object({
    rollLength: z.coerce.number().min(0).optional(), // 卷长 (m)
    patternRepeat: z.coerce.number().min(0).optional(), // 花距 (cm)
    fabricWidth: z.coerce.number().min(0).optional(), // 幅宽 (m)
    material: z.string().optional(),
    surfaceProcess: z.string().optional(),
});

export const curtainAttributesSchema = z.object({
    fabricWidth: z.coerce.number().min(0).optional(), // 幅宽 (m)
    shadingRate: z.coerce.number().min(0).max(100).optional(), // 遮光率 (%)
    gramWeight: z.coerce.number().min(0).optional(), // 克重 (g/m²)
    component: z.string().optional(),
    processTechnique: z.string().optional(),
});

export const productAttributesSchema = z.union([
    wallpaperAttributesSchema,
    curtainAttributesSchema,
    z.record(z.string(), z.any())
]);

/**
 * 列表查询 Schema
 */
export const getProductsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
    category: z.enum(['ALL', ...productCategoryEnum.enumValues] as [string, ...string[]]).optional(),
    search: z.string().max(100).optional(),
    isActive: z.coerce.boolean().optional(),
});

/**
 * 创建产品 Schema
 */
export const createProductSchema = z.object({
    sku: z.string().min(1, 'SKU 不能为空').max(50),
    name: z.string().min(1, '产品名称不能为空').max(200),
    category: z.enum(productCategoryEnum.enumValues),
    unit: z.string().min(1, '单位不能为空').max(20).default('件'),

    // 价格 - 成本维度
    purchasePrice: z.coerce.number().min(0, '采购价不能为负数').default(0),
    logisticsCost: z.coerce.number().min(0).default(0),
    processingCost: z.coerce.number().min(0).default(0),
    lossRate: z.coerce.number().min(0).max(1).default(0.05),

    // 价格 - 销售维度
    retailPrice: z.coerce.number().min(0).default(0),
    channelPriceMode: z.enum(['FIXED', 'DISCOUNT']).default('FIXED'),
    channelPrice: z.coerce.number().min(0).default(0),
    channelDiscountRate: z.coerce.number().min(0).max(1).default(1),
    floorPrice: z.coerce.number().min(0).default(0),

    // 权限与关联
    isToBEnabled: z.boolean().default(true),
    isToCEnabled: z.boolean().default(true),
    defaultSupplierId: z.string().uuid().optional(),
    isStockable: z.boolean().default(false),

    description: z.string().optional(),
    attributes: z.record(z.string(), z.any()).default({}),
});

/**
 * 更新产品 Schema
 */
export const updateProductSchema = createProductSchema.partial().extend({
    id: z.string().uuid(),
});

/**
 * 删除产品 Schema
 */
export const deleteProductSchema = z.object({
    id: z.string().uuid(),
});

/**
 * 状态切换 Schema
 */
export const activateProductSchema = z.object({
    id: z.string().uuid(),
    isActive: z.boolean(),
});

/**
 * 详情查询 Schema
 */
export const getProductSchema = z.object({
    id: z.string().uuid(),
});
