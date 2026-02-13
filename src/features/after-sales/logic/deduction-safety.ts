'use server';

import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { liabilityNotices } from '@/shared/api/schema/after-sales';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

/**
 * 扣款安全水位逻辑
 * 
 * 功能：
 * 1. 检查被扣款方的累计欠款余额
 * 2. 超过安全阈值时阻止新扣款或发出预警
 * 3. 维护欠款账本（累计扣款 vs 已结算）
 */

// 安全水位配置
export const DEDUCTION_SAFETY_CONFIG = {
    // 安装工最大累计欠款额度
    INSTALLER_MAX_DEDUCTION: 5000,
    // 供应商最大累计欠款比例（相对于历史采购额）
    SUPPLIER_MAX_RATIO: 0.1,
    // 预警阈值（达到最大值的百分比时预警）
    WARNING_THRESHOLD: 0.8,
} as const;

// 欠款账本类型
export interface DeductionLedger {
    partyType: 'INSTALLER' | 'FACTORY';
    partyId: string;
    partyName: string;
    totalDeducted: number;     // 累计扣款
    totalSettled: number;      // 已结算
    pendingAmount: number;     // 待结算（欠款余额）
    maxAllowed: number;        // 最大允许额度
    usedRatio: number;         // 使用比例
    status: 'NORMAL' | 'WARNING' | 'BLOCKED';
}

// 扣款检查结果
export interface DeductionCheckResult {
    allowed: boolean;
    status: 'NORMAL' | 'WARNING' | 'BLOCKED';
    currentPending: number;
    maxAllowed: number;
    remainingQuota: number;
    message: string;
}

/**
 * 获取责任方的欠款账本
 */
export async function getDeductionLedger(
    partyType: 'INSTALLER' | 'FACTORY',
    partyId: string
): Promise<DeductionLedger | null> {
    const session = await auth();
    if (!session?.user?.tenantId) return null;

    const tenantId = session.user.tenantId;

    // 查询该责任方的所有定责单
    const notices = await db.query.liabilityNotices.findMany({
        where: and(
            eq(liabilityNotices.tenantId, tenantId),
            eq(liabilityNotices.liablePartyType, partyType),
            eq(liabilityNotices.liablePartyId, partyId)
        ),
    });

    if (notices.length === 0) {
        return null;
    }

    // 统计累计扣款和已结算
    let totalDeducted = 0;
    let totalSettled = 0;

    for (const notice of notices) {
        const amount = Number(notice.amount || 0);
        if (notice.status === 'CONFIRMED') {
            totalDeducted += amount;
            if (notice.financeStatus === 'SYNCED') {
                totalSettled += amount;
            }
        }
    }

    const pendingAmount = totalDeducted - totalSettled;

    // 计算最大额度
    let maxAllowed = 0;
    if (partyType === 'INSTALLER') {
        maxAllowed = DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION;
    } else if (partyType === 'FACTORY') {
        // 供应商按历史采购额比例计算
        // TODO: 查询历史采购总额
        maxAllowed = 50000; // 暂时固定值
    }

    const usedRatio = maxAllowed > 0 ? pendingAmount / maxAllowed : 0;

    let status: DeductionLedger['status'] = 'NORMAL';
    if (usedRatio >= 1) {
        status = 'BLOCKED';
    } else if (usedRatio >= DEDUCTION_SAFETY_CONFIG.WARNING_THRESHOLD) {
        status = 'WARNING';
    }

    return {
        partyType,
        partyId,
        partyName: '', // 需要关联查询
        totalDeducted,
        totalSettled,
        pendingAmount,
        maxAllowed,
        usedRatio,
        status,
    };
}

/**
 * 检查是否可以新增扣款
 */
export async function checkDeductionAllowed(
    partyType: 'INSTALLER' | 'FACTORY',
    partyId: string,
    newDeductionAmount: number
): Promise<DeductionCheckResult> {
    const ledger = await getDeductionLedger(partyType, partyId);

    if (!ledger) {
        // 新责任方，检查首次扣款是否超额
        const maxAllowed = partyType === 'INSTALLER'
            ? DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION
            : 50000;

        if (newDeductionAmount > maxAllowed) {
            return {
                allowed: false,
                status: 'BLOCKED',
                currentPending: 0,
                maxAllowed,
                remainingQuota: maxAllowed,
                message: `扣款金额 ¥${newDeductionAmount} 超过最大限额 ¥${maxAllowed}`,
            };
        }

        return {
            allowed: true,
            status: 'NORMAL',
            currentPending: 0,
            maxAllowed,
            remainingQuota: maxAllowed - newDeductionAmount,
            message: '首次扣款，额度充足',
        };
    }

    const newTotal = ledger.pendingAmount + newDeductionAmount;
    const newRatio = ledger.maxAllowed > 0 ? newTotal / ledger.maxAllowed : 0;

    // 检查是否超额
    if (newTotal > ledger.maxAllowed) {
        return {
            allowed: false,
            status: 'BLOCKED',
            currentPending: ledger.pendingAmount,
            maxAllowed: ledger.maxAllowed,
            remainingQuota: Math.max(0, ledger.maxAllowed - ledger.pendingAmount),
            message: `累计欠款将达到 ¥${newTotal}，超过最大限额 ¥${ledger.maxAllowed}`,
        };
    }

    // 检查是否预警
    if (newRatio >= DEDUCTION_SAFETY_CONFIG.WARNING_THRESHOLD) {
        return {
            allowed: true,
            status: 'WARNING',
            currentPending: ledger.pendingAmount,
            maxAllowed: ledger.maxAllowed,
            remainingQuota: ledger.maxAllowed - newTotal,
            message: `警告：扣款后累计欠款将达到 ¥${newTotal}（${(newRatio * 100).toFixed(1)}%），接近上限`,
        };
    }

    return {
        allowed: true,
        status: 'NORMAL',
        currentPending: ledger.pendingAmount,
        maxAllowed: ledger.maxAllowed,
        remainingQuota: ledger.maxAllowed - newTotal,
        message: '额度充足',
    };
}

/**
 * 获取所有责任方的欠款汇总（用于管理看板）
 */
export async function getAllDeductionLedgers(): Promise<DeductionLedger[]> {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    const tenantId = session.user.tenantId;

    // 按责任方分组统计
    const result = await db
        .select({
            partyType: liabilityNotices.liablePartyType,
            partyId: liabilityNotices.liablePartyId,
            totalDeducted: sql<string>`SUM(CASE WHEN ${liabilityNotices.status} = 'CONFIRMED' THEN CAST(${liabilityNotices.amount} AS DECIMAL) ELSE 0 END)`,
            totalSettled: sql<string>`SUM(CASE WHEN ${liabilityNotices.financeStatus} = 'SYNCED' THEN CAST(${liabilityNotices.amount} AS DECIMAL) ELSE 0 END)`,
        })
        .from(liabilityNotices)
        .where(eq(liabilityNotices.tenantId, tenantId))
        .groupBy(liabilityNotices.liablePartyType, liabilityNotices.liablePartyId);

    return result
        .filter(r => r.partyId)
        .map(r => {
            const totalDeducted = Number(r.totalDeducted || 0);
            const totalSettled = Number(r.totalSettled || 0);
            const pendingAmount = totalDeducted - totalSettled;

            const isInstaller = r.partyType === 'INSTALLER';
            const maxAllowed = isInstaller
                ? DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION
                : 50000;

            const usedRatio = maxAllowed > 0 ? pendingAmount / maxAllowed : 0;

            let status: DeductionLedger['status'] = 'NORMAL';
            if (usedRatio >= 1) status = 'BLOCKED';
            else if (usedRatio >= DEDUCTION_SAFETY_CONFIG.WARNING_THRESHOLD) status = 'WARNING';

            return {
                partyType: r.partyType as 'INSTALLER' | 'FACTORY',
                partyId: r.partyId!,
                partyName: '', // 需要关联查询补充
                totalDeducted,
                totalSettled,
                pendingAmount,
                maxAllowed,
                usedRatio,
                status,
            };
        });
}
