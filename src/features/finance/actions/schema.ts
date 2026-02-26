import { z } from 'zod';

// ==================== 基础配置 (Base Config) ====================

export const updateFinanceConfigSchema = z.object({
    allow_difference: z.boolean(),
    max_difference_amount: z.number().min(0).default(100),
    difference_handling: z.enum(['AUTO_ADJUST', 'MANUAL_RECORD', 'FORBIDDEN']).default('MANUAL_RECORD'),
    allow_rounding: z.boolean(),
    rounding_mode: z.enum(['ROUND_DOWN', 'ROUND_HALF_UP']).default('ROUND_HALF_UP'),
    rounding_unit: z.enum(['YUAN', 'JIAO', 'FEN']).default('YUAN'),
});

export const createFinanceAccountSchema = z.object({
    accountNo: z.string().min(1, '账户编号不能为空'),
    accountName: z.string().min(1, '账户名称不能为空'),
    accountType: z.enum(['BANK', 'WECHAT', 'ALIPAY', 'CASH']),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    branchName: z.string().optional(),
    holderName: z.string().min(1, '持有人不能为空'),
    isDefault: z.boolean().default(false),
    remark: z.string().optional(),
});

export const updateFinanceAccountSchema = createFinanceAccountSchema.partial().extend({
    id: z.string().uuid(),
    isActive: z.boolean().optional(),
});

// ==================== 收款单 (AR / Payment Order) ====================

export const createPaymentOrderSchema = z.object({
    customerId: z.string().uuid().optional(), // 预收款可以只凭电话? 需求说关联已有客户
    customerName: z.string().min(1, '客户姓名不能为空'),
    customerPhone: z.string().min(1, '客户电话不能为空'),
    type: z.enum(['PREPAID', 'NORMAL']).default('NORMAL'),
    totalAmount: z.number().min(0.01, '收款金额必须大于0'),
    paymentMethod: z.string().min(1, '支付方式不能为空'),
    accountId: z.string().uuid().optional(),
    proofUrl: z.string().min(1, '支付凭证不能为空'),
    receivedAt: z.coerce.date(),
    remark: z.string().optional(),

    // 关联订单明细
    items: z.array(z.object({
        orderId: z.string().uuid(),
        amount: z.number().min(0.01),
    })).optional(),
});

export const verifyPaymentOrderSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['VERIFIED', 'REJECTED']),
    remark: z.string().optional(),
});

// ==================== 付款单 (AP / Payment Bill) ====================

export const createPaymentBillSchema = z.object({
    type: z.enum(['SUPPLIER', 'LABOR', 'REFUND']).default('SUPPLIER'),
    payeeType: z.enum(['SUPPLIER', 'WORKER', 'CUSTOMER']),
    payeeId: z.string().uuid(),
    payeeName: z.string().min(1, '收款方名称不能为空'),
    orderId: z.string().uuid().optional(),
    amount: z.number().min(0.01, '付款金额必须大于0'),
    paymentMethod: z.string().min(1, '支付方式不能为空'),
    accountId: z.string().uuid().optional(),
    proofUrl: z.string().min(1, '支付凭证不能为空'),
    paidAt: z.coerce.date().optional(),
    remark: z.string().optional(),

    // 关联对账单明细
    items: z.array(z.object({
        statementType: z.enum(['AP_SUPPLIER', 'AP_LABOR']),
        statementId: z.string().uuid(),
        amount: z.number().min(0.01),
    })).optional(),
});

export const verifyPaymentBillSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['VERIFIED', 'REJECTED']),
    remark: z.string().optional(),
});

// ==================== 对账分层定义 (Reconciliation Layers) ====================
/**
 * L1 业务核销 - 实时核销层
 * - 订单与收款单的实时匹配
 * - 单笔或批量核销
 * - 即时更新账单状态
 * 
 * L2 账单确认 - 周期对账层
 * - 按周/月生成对账汇总
 * - 客户确认机制
 * - 开票关联
 */
export const RECONCILIATION_LAYERS = {
    L1_BUSINESS_WRITEOFF: 'L1_BUSINESS_WRITEOFF', // 业务核销
    L2_STATEMENT_CONFIRM: 'L2_STATEMENT_CONFIRM', // 账单确认
} as const;

export type ReconciliationLayer = keyof typeof RECONCILIATION_LAYERS;

// ==================== 凭证管理 (Journal Entries) ====================

export const createJournalEntrySchema = z.object({
    periodId: z.string().uuid('无效的账期ID'),
    entryDate: z.coerce.date(),
    description: z.string().optional(),
    lines: z.array(z.object({
        accountId: z.string().uuid('无效的科目ID'),
        debitAmount: z.number().min(0),
        creditAmount: z.number().min(0),
        description: z.string().optional(),
    })).min(2, '至少需要两条分录'),
});

export const updateJournalEntryStatusSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'POSTED']),
    rejectReason: z.string().optional(), // 用于驳回时的备注
});
