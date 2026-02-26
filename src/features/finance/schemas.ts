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

// ==================== 费用录入 Schemas (Phase 6) ====================

export const createExpenseSchema = z.object({
    accountId: z.string().uuid('请选择有效的费用科目'),
    amount: z.coerce.number().min(0.01, '金额必须大于0'),
    expenseDate: z.coerce.date().default(() => new Date()),
    description: z.string().min(1, '请输入费用摘要').max(500, '摘要过长'),
    createVoucher: z.boolean().default(false), // 是否自动生成凭证
});

export const importExpenseRowSchema = z.object({
    accountCode: z.string().min(1, '科目编码不能为空'),
    amount: z.coerce.number().min(0.01, '金额必须大于0'),
    expenseDate: z.coerce.date(),
    description: z.string().min(1, '摘要不能为空').max(500, '摘要过长'),
});

export const importExpensesSchema = z.object({
    rows: z.array(importExpenseRowSchema).min(1, '导入数据不能为空'),
    createVoucher: z.boolean().default(false), // 是否自动生成凭证
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ImportExpenseRowInput = z.infer<typeof importExpenseRowSchema>;
export type ImportExpensesInput = z.infer<typeof importExpensesSchema>;
