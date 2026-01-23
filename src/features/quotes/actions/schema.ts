import { z } from 'zod';

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

    attributes: z.record(z.string(), z.any()).optional(),
    remark: z.string().optional(),
});

export const updateQuoteItemSchema = z.object({
    id: z.string().uuid(),

    quantity: z.number().min(0).optional(),
    unitPrice: z.number().min(0).optional(),

    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    foldRatio: z.number().min(0).optional(),
    processFee: z.number().min(0).optional(),

    attributes: z.record(z.string(), z.any()).optional(),
    remark: z.string().optional(),
    sortOrder: z.number().int().optional(),
});

export const reorderQuoteItemsSchema = z.object({
    quoteId: z.string().uuid(),
    roomId: z.string().uuid().nullable(),
    items: z.array(z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int(),
    })),
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
    leadId: z.string(),
    planType: z.string(),
    rooms: z.array(z.object({
        name: z.string(),
        width: z.number().positive(),
        height: z.number().positive(),
        hasSheer: z.boolean().default(false),
        hasBox: z.boolean().default(false),
        windowType: z.string().default('STRAIGHT'),
        hasFabric: z.boolean().default(true),
    })),
});
