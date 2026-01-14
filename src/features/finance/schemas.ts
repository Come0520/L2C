/**
 * 财务模块 Zod Schema 定义
 */

import { z } from 'zod';

// ==================== 枚举定义 ====================

export const paymentMethodEnum = z.enum(['CASH', 'WECHAT', 'ALIPAY', 'BANK_TRANSFER', 'OTHER']);
export const paymentTypeEnum = z.enum(['DEPOSIT', 'PROGRESS', 'FINAL', 'REFUND', 'OTHER']);
export const receivableStatusEnum = z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']);

// ==================== 收款单 Schemas ====================

export const createReceivableSchema = z.object({
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    amount: z.coerce.number().min(0, '金额必须大于等于0'),
    type: paymentTypeEnum.default('DEPOSIT'),
    dueDate: z.coerce.date().optional(),
    remark: z.string().optional(),
});

export const updateReceivableSchema = z.object({
    id: z.string().uuid(),
    amount: z.coerce.number().min(0).optional(),
    dueDate: z.coerce.date().optional(),
    remark: z.string().optional(),
    status: receivableStatusEnum.optional(),
});

// ==================== 支付记录 Schemas ====================

export const createPaymentSchema = z.object({
    receivableId: z.string().uuid().optional(),
    orderId: z.string().uuid(),
    amount: z.coerce.number().min(0.01, '支付金额必须大于0'),
    paymentMethod: paymentMethodEnum,
    paidAt: z.coerce.date().default(() => new Date()),
    transactionId: z.string().optional(),
    payer: z.string().optional(),
    remark: z.string().optional(),
    images: z.array(z.string().url()).optional(),
});

export const confirmPaymentSchema = z.object({
    id: z.string().uuid(),
    verifiedAt: z.coerce.date().default(() => new Date()),
    status: z.enum(['VERIFIED', 'REJECTED']),
    remark: z.string().optional(),
});

// ==================== 查询/统计 Schemas ====================

export const getFinanceStatsSchema = z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

export const getReceivablesSchema = z.object({
    page: z.coerce.number().default(1),
    pageSize: z.coerce.number().default(10),
    status: receivableStatusEnum.optional(),
    customerId: z.string().optional(),
    orderId: z.string().optional(),
});

// Types
export type CreateReceivableInput = z.infer<typeof createReceivableSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
