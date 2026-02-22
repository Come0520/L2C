import { z } from 'zod';

export const getOrdersSchema = z.object({
    page: z.number().default(1),
    pageSize: z.number().default(10),
    status: z.string().optional(),
    search: z.string().optional(),
    salesId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    amountMin: z.string().optional(),
    amountMax: z.string().optional(),
    deliveryAddress: z.string().optional(),
});

export const cancelOrderSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.string().optional(),
    version: z.number().int().positive(),
});

export const createOrderSchema = z.object({
    quoteId: z.string().uuid(),
    paymentProofImg: z.string().optional(),
    confirmationImg: z.string().optional(),
    paymentAmount: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'WECHAT', 'ALIPAY', 'BANK']).optional(),
    remark: z.string().optional(),
});

export const splitOrderSchema = z.object({
    orderId: z.string().uuid(),
    items: z.array(
        z.object({
            itemId: z.string().uuid(),
            quantity: z.string(),
            supplierId: z.string().uuid(),
        })
    ),
    version: z.number().int().positive(),
});

export const requestDeliverySchema = z.object({
    orderId: z.string().uuid(),
    company: z.string().min(1, '请填写物流公司'),
    trackingNo: z.string().optional(),
    remark: z.string().optional(),
    version: z.number().int().positive(),
});

export const updateLogisticsSchema = z.object({
    orderId: z.string().uuid(),
    company: z.string().min(1, '请填写物流公司'),
    trackingNo: z.string().min(1, '请填写快递单号'),
    version: z.number().int().positive(),
});

export const confirmInstallationSchema = z.object({
    orderId: z.string().uuid(),
    version: z.number().int().positive(),
});

// 叫停原因枚举
export const HALT_REASONS = [
    'CUSTOMER_REQUEST',    // 客户要求
    'PAYMENT_ISSUE',       // 付款问题
    'PRODUCTION_ISSUE',    // 生产问题
    'LOGISTICS_ISSUE',     // 物流问题
    'MATERIAL_SHORTAGE',   // 材料短缺
    'OTHER',               // 其他
] as const;

// 撤单原因枚举
export const CANCEL_REASONS = [
    '客户主动取消',
    '客户无法联系',
    '产品缺货/无法生产',
    '价格争议',
    '重复下单',
    '其他原因',
] as const;

export const CANCELABLE_STATUSES = ['PENDING_PRODUCTION', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALL'] as const;

export const requestOrderCancellationSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.enum(CANCEL_REASONS),
    remark: z.string().optional(),
    version: z.number().int().positive(),
});

/**
 * @deprecated Use haltOrderSchema
 */
export const pauseOrderSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(2, '请填写叫停原因'),
    version: z.number().int().positive(),
});

export const haltOrderSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.enum(HALT_REASONS),
    remark: z.string().optional(),
    version: z.number().int().positive(),
});

export const completeOrderSchema = z.object({
    orderId: z.string().uuid(),
    version: z.number().int().positive(),
});

export const closeOrderSchema = z.object({
    orderId: z.string().uuid(),
    version: z.number().int().positive(),
});

export const resumeOrderSchema = z.object({
    orderId: z.string().uuid(),
    remark: z.string().optional(),
    version: z.number().int().positive(),
});

export const confirmProductionSchema = z.object({
    orderId: z.string().uuid(),
    productionStartTime: z.string().optional(),
    remark: z.string().optional(),
    version: z.number().int().positive(),
});

export const requestCustomerConfirmationSchema = z.object({
    orderId: z.string().uuid(),
    version: z.number().int().positive(),
});

export const customerRejectSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(1, '请填写拒绝原因'),
    version: z.number().int().positive(),
});
