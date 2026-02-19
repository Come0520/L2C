import { z } from 'zod';

// 共享 attributes 校验规则：仅允许基础类型值，防止原型链污染或注入复杂对象
// P1-R5-01: 安全修复
const safeAttributesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null(),
  z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))])
).optional();

export const createQuoteSchema = z.object({
  customerId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  measureVariantId: z.string().uuid().optional(),
  bundleId: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  notes: z.string().optional(),
});

export const createQuoteBundleSchema = z.object({
  customerId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  summaryMode: z.string().optional(),
  remark: z.string().optional(),
});

export const updateQuoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200).optional(),
  discountRate: z.number().min(0).max(1).optional(),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  validUntil: z.date().optional(),
});

export const submitQuoteSchema = z.object({
  id: z.string().uuid(),
});

export const acceptQuoteSchema = z.object({
  id: z.string().uuid(),
});

export const rejectQuoteSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, '必须提供拒绝原因'),
});

export const createQuoteRoomSchema = z.object({
  quoteId: z.string().uuid(),
  name: z.string().min(1).max(100),
  measureRoomId: z.string().uuid().optional(),
});

export const updateQuoteRoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export const createQuoteItemSchema = z.object({
  quoteId: z.string().uuid(),
  roomId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().optional(),

  category: z.string().min(1).max(50),
  productId: z.string().uuid().optional(),
  productName: z.string().min(1).max(200),
  productSku: z.string().max(100).optional(),

  unit: z.string().max(20).optional(),
  unitPrice: z.number().min(0),
  quantity: z.number().min(0),

  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  foldRatio: z.number().min(0).optional(),
  processFee: z.number().min(0).optional(),

  // P1-08 安全修复：限制 attributes 值类型，禁止注入任意对象
  // P1-08/P1-R5-01 安全修复：使用统一的安全校验规则
  attributes: safeAttributesSchema,
  remark: z.string().optional(),
});

export const updateQuoteItemSchema = z.object({
  id: z.string().uuid(),

  // 产品关联字段（更换产品时使用）
  productId: z.string().uuid().optional(),
  productName: z.string().max(200).optional(),
  category: z.string().max(50).optional(),

  quantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),

  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  foldRatio: z.number().min(0).optional(),
  processFee: z.number().min(0).optional(),

  attributes: safeAttributesSchema,
  remark: z.string().optional(),
  unit: z.string().max(20).optional(),
  sortOrder: z.number().int().optional(),
});

export const reorderQuoteItemsSchema = z.object({
  quoteId: z.string().uuid(),
  roomId: z.string().uuid().nullable(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int(),
    })
  ),
});

export const deleteQuoteItemSchema = z.object({
  id: z.string().uuid(),
});

// 报价转订单 schema（tenantId 从 context 获取）
export const convertQuoteToOrderSchema = z.object({
  quoteId: z.string().uuid(),
});

// 拒绝报价折扣 schema（tenantId 和 rejectedBy 从 context 获取）
export const rejectQuoteDiscountSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, '必须提供拒绝原因'),
});

export const createQuickQuoteSchema = z.object({
  leadId: z.string().uuid(),
  planType: z.string(),
  rooms: z.array(
    z.object({
      name: z.string(),
      width: z.number().positive(),
      height: z.number().positive(),
      hasSheer: z.boolean().default(false),
      hasBox: z.boolean().default(false),
      windowType: z.string().default('STRAIGHT'),
      hasFabric: z.boolean().default(true),
    })
  ),
});
