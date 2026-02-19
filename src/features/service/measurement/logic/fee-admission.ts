'use server';

import { db } from '@/shared/api/db';
import { receiptBills, orders } from '@/shared/api/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';


/**
 * 定金检查结果
 */
export interface DepositCheckResult {
    /** 是否需要定金 */
    requiresDeposit: boolean;
    /** 定金是否已支付 */
    isDepositPaid: boolean;
    /** 已支付金额 */
    paidAmount: number;
    /** 订单总金额 */
    totalAmount: number;
    /** 所需定金比例 */
    requiredDepositRate: number;
    /** 所需定金金额 */
    requiredDepositAmount: number;
    /** 提示消息 */
    message: string;
    /** 是否可以继续（无需定金或已支付） */
    canProceed: boolean;
}

/**
 * 默认定金配置
 */
const DEFAULT_DEPOSIT_CONFIG = {
    /** 默认定金比例（30%） */
    DEFAULT_DEPOSIT_RATE: 0.3,
    /** 免定金的订单金额阈值（小额订单免定金） */
    EXEMPT_THRESHOLD: 500,
    /** 测量费用默认金额（元） */
    DEFAULT_MEASURE_FEE: 100,
};

/**
 * 检查订单定金支付状态
 * 
 * @param orderId - 订单 ID
 * @param tenantId - 租户 ID
 * @param config - 可选配置
 * @returns 定金检查结果
 */
export async function checkOrderDeposit(
    orderId: string,
    tenantId: string,
    config?: {
        depositRate?: number;
        exemptThreshold?: number;
    }
): Promise<DepositCheckResult> {
    const depositRate = config?.depositRate ?? DEFAULT_DEPOSIT_CONFIG.DEFAULT_DEPOSIT_RATE;
    const exemptThreshold = config?.exemptThreshold ?? DEFAULT_DEPOSIT_CONFIG.EXEMPT_THRESHOLD;

    // 获取订单信息
    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, orderId),
            eq(orders.tenantId, tenantId)
        ),
        columns: {
            id: true,
            totalAmount: true,
            balanceAmount: true,
        }
    });

    if (!order) {
        return {
            requiresDeposit: false,
            isDepositPaid: false,
            paidAmount: 0,
            totalAmount: 0,
            requiredDepositRate: depositRate,
            requiredDepositAmount: 0,
            message: '订单不存在',
            canProceed: false,
        };
    }

    const totalAmount = parseFloat(order.totalAmount || '0');
    const balanceAmount = parseFloat(order.balanceAmount || '0');
    const paidAmount = totalAmount - balanceAmount;

    // 小额订单免定金
    if (totalAmount <= exemptThreshold) {
        return {
            requiresDeposit: false,
            isDepositPaid: false,
            paidAmount,
            totalAmount,
            requiredDepositRate: depositRate,
            requiredDepositAmount: 0,
            message: '小额订单免定金',
            canProceed: true,
        };
    }

    const requiredDepositAmount = totalAmount * depositRate;
    const isDepositPaid = paidAmount >= requiredDepositAmount;

    return {
        requiresDeposit: true,
        isDepositPaid,
        paidAmount,
        totalAmount,
        requiredDepositRate: depositRate,
        requiredDepositAmount,
        message: isDepositPaid
            ? `定金已支付（已收 ¥${paidAmount.toFixed(2)}，需 ¥${requiredDepositAmount.toFixed(2)}）`
            : `定金未足额支付（已收 ¥${paidAmount.toFixed(2)}，需 ¥${requiredDepositAmount.toFixed(2)}）`,
        canProceed: isDepositPaid,
    };
}

/**
 * 检查客户的总收款金额（跨订单）
 * 
 * @param customerId - 客户 ID
 * @param tenantId - 租户 ID
 * @returns 客户已收款总金额
 */
export async function getCustomerTotalPaidAmount(
    customerId: string,
    tenantId: string
): Promise<number> {
    const result = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(${receiptBills.totalAmount} AS DECIMAL)), 0)`
    })
        .from(receiptBills)
        .where(and(
            eq(receiptBills.tenantId, tenantId),
            eq(receiptBills.customerId, customerId),
            // 只统计已核销或已使用的收款单
            inArray(receiptBills.status, ['VERIFIED', 'PARTIAL_USED', 'FULLY_USED'])
        ));

    return result[0]?.total || 0;
}

/**
 * 测量费用准入校验
 * - 检查是否需要收取测量费
 * - 检查客户是否有待支付的测量费
 * 
 * @param leadId - 线索 ID
 * @param tenantId - 租户 ID
 * @param isFeeExempt - 是否申请免费
 * @returns 准入校验结果
 */
export async function checkMeasureFeeAdmission(
    leadId: string,
    tenantId: string,
    isFeeExempt: boolean
): Promise<{
    requiresFee: boolean;
    isPaid: boolean;
    exemptApproved: boolean;
    message: string;
    canProceed: boolean;
}> {
    // 如果申请免费，需要走审批流程
    if (isFeeExempt) {
        return {
            requiresFee: true,
            isPaid: false,
            exemptApproved: false, // 需要审批
            message: '申请免费测量，需要店长审批',
            canProceed: false, // 需要等待审批通过
        };
    }

    // TODO: 这里可以扩展为检查是否已支付测量费
    // 目前默认允许创建测量任务，测量费在现场收取
    return {
        requiresFee: true,
        isPaid: false,
        exemptApproved: false,
        message: '测量费将在现场收取',
        canProceed: true,
    };
}

/**
 * 测量任务派遣前的定金校验
 * - 用于在派遣测量师前检查客户定金状态
 * 
 * @param orderId - 关联订单 ID（如果有）
 * @param leadId - 线索 ID
 * @param tenantId - 租户 ID
 * @param skipCheck - 是否跳过检查（例如销售自测）
 * @returns 校验结果
 */
export async function checkDispatchAdmission(
    orderId: string | null,
    leadId: string,
    tenantId: string,
    skipCheck: boolean = false
): Promise<{
    canDispatch: boolean;
    reason: string;
    depositStatus?: DepositCheckResult;
}> {
    // 跳过检查（例如销售自测、盲测等）
    if (skipCheck) {
        return {
            canDispatch: true,
            reason: '无需定金校验',
        };
    }

    // 如果没有关联订单，允许派遣（测量费现场收取）
    if (!orderId) {
        return {
            canDispatch: true,
            reason: '无关联订单，测量费现场收取',
        };
    }

    // 检查订单定金状态
    const depositCheck = await checkOrderDeposit(orderId, tenantId);

    if (!depositCheck.canProceed) {
        return {
            canDispatch: false,
            reason: depositCheck.message,
            depositStatus: depositCheck,
        };
    }

    return {
        canDispatch: true,
        reason: depositCheck.message,
        depositStatus: depositCheck,
    };
}
