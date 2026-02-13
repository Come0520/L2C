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

export const getOrderByIdSchema = z.object({
    id: z.string().uuid(),
});

export const createOrderFromQuoteSchema = z.object({
    quoteId: z.string(),
    confirmationProof: z.string().optional(),
});

export const confirmProductionSchema = z.object({
    orderId: z.string(),
});

export const shipOrderSchema = z.object({
    orderId: z.string(),
    logisticsCompany: z.string().optional(),
    logisticsNo: z.string().optional(),
});

export const completeOrderSchema = z.object({
    orderId: z.string(),
});

export const closeOrderSchema = z.object({
    orderId: z.string(),
});

export const cancelOrderSchema = z.object({
    orderId: z.string(),
    reason: z.string().optional(),
});

export const requestOrderCancellationSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(5, '请填写至少5个字的撤单原因'),
});

export const pauseOrderSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(2, '请填写叫停原因'),
});

export const resumeOrderSchema = z.object({
    orderId: z.string().uuid(),
});
