// 产品管理模块 - 验证工具函数
import { z } from 'zod';

// 产品状态枚举
const PRODUCT_STATUS_ENUM = z.enum(['draft', 'pending', 'approved', 'rejected', 'online', 'offline']);

// 产品价格验证模式
export const productPricesSchema = z.object({
  costPrice: z.number().min(0, '成本价必须大于等于0'),
  internalCostPrice: z.number().min(0, '内部成本价必须大于等于0'),
  internalSettlementPrice: z.number().min(0, '内部结算价必须大于等于0'),
  settlementPrice: z.number().min(0, '结算价必须大于等于0'),
  retailPrice: z.number().min(0, '零售价必须大于等于0')
});

// 产品图片验证模式
export const productImagesSchema = z.object({
  detailImages: z.array(z.string().url('图片URL格式无效')),
  effectImages: z.array(z.string().url('图片URL格式无效')),
  caseImages: z.array(z.string().url('图片URL格式无效'))
});

// 产品标签验证模式
export const productTagsSchema = z.object({
  styleTags: z.array(z.string().min(1, '标签不能为空')),
  packageTags: z.array(z.string().min(1, '标签不能为空')),
  activityTags: z.array(z.string().min(1, '标签不能为空')),
  seasonTags: z.array(z.string().min(1, '标签不能为空')),
  demographicTags: z.array(z.string().min(1, '标签不能为空'))
});

// 产品属性验证模式
export const productAttributesSchema = z.record(z.string(), z.string());

// 产品基本信息验证模式
export const productBasicInfoSchema = z.object({
  productCode: z.string().min(1, '产品编码不能为空').max(50, '产品编码不能超过50个字符'),
  productName: z.string().min(1, '产品名称不能为空').max(100, '产品名称不能超过100个字符'),
  categoryLevel1: z.string().min(1, '一级分类不能为空'),
  categoryLevel2: z.string().min(1, '二级分类不能为空'),
  unit: z.string().min(1, '产品单位不能为空'),
  status: PRODUCT_STATUS_ENUM
});

// 完整产品验证模式
export const productSchema = z.object({
  ...productBasicInfoSchema.shape,
  prices: productPricesSchema,
  attributes: productAttributesSchema,
  images: productImagesSchema,
  tags: productTagsSchema
});

// 产品筛选参数验证模式
export const productFilterParamsSchema = z.object({
  searchTerm: z.string().optional().default(''),
  categoryLevel1: z.string().optional().default('all'),
  categoryLevel2: z.string().optional().default('all'),
  status: z.string().optional().default('all'),
  page: z.number().int().min(1).optional().default(1),
  itemsPerPage: z.number().int().min(1).max(100).optional().default(10)
});

// 验证产品数据
export const validateProduct = (productData: any) => {
  return productSchema.safeParse(productData);
};

// 验证产品基本信息
export const validateProductBasicInfo = (basicInfo: any) => {
  return productBasicInfoSchema.safeParse(basicInfo);
};

// 验证产品筛选参数
export const validateProductFilterParams = (params: any) => {
  return productFilterParamsSchema.safeParse(params);
};
