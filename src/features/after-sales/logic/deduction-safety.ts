'use server';

import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { liabilityNotices } from '@/shared/api/schema/after-sales';
import { suppliers } from '@/shared/api/schema/supply-chain';
import { customers } from '@/shared/api/schema/customers';
import { users } from '@/shared/api/schema/infrastructure';
import { purchaseOrders } from '@/shared/api/schema/supply-chain';
import { eq, and, sql, sum } from 'drizzle-orm';

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
    // 测量员最大累计欠款额度
    MEASURER_MAX_DEDUCTION: 2000,
    // 物流公司最大累计欠款额度
    LOGISTICS_MAX_DEDUCTION: 5000,
    // 供应商最大累计欠款比例（相对于历史采购额）
    SUPPLIER_MAX_RATIO: 0.1,
    // 默认备选最大限额 (当无法计算动态限额时)
    DEFAULT_MAX_DEDUCTION: 50000,
    // 预警阈值（达到最大值的百分比时预警）
    WARNING_THRESHOLD: 0.8,
} as const;

// P1 FIX (AS-10): 支持全量责任方类型
export type LiablePartyType = 'COMPANY' | 'FACTORY' | 'INSTALLER' | 'MEASURER' | 'LOGISTICS' | 'CUSTOMER';

// 欠款账本类型
export interface DeductionLedger {
    partyType: LiablePartyType;
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
    partyType: LiablePartyType,
    partyId: string
): Promise<DeductionLedger | null> {
    const session = await auth();
    if (!session?.user?.tenantId) return null;

    const tenantId = session.user.tenantId;

    // P1 FIX (AS-10): 使用聚合查询替换内存循环，解决 N+1 潜在风险
    const [summary] = await db
        .select({
            totalDeducted: sql<string>`SUM(CASE WHEN ${liabilityNotices.status} = 'CONFIRMED' THEN ${liabilityNotices.amount} ELSE 0 END)`,
            totalSettled: sql<string>`SUM(CASE WHEN ${liabilityNotices.status} = 'CONFIRMED' AND ${liabilityNotices.financeStatus} = 'SYNCED' THEN ${liabilityNotices.amount} ELSE 0 END)`,
        })
        .from(liabilityNotices)
        .where(and(
            eq(liabilityNotices.tenantId, tenantId),
            eq(liabilityNotices.liablePartyType, partyType),
            eq(liabilityNotices.liablePartyId, partyId)
        ));

    if (!summary || (!summary.totalDeducted && !summary.totalSettled)) {
        return null;
    }

    const totalDeducted = parseFloat(summary.totalDeducted || '0');
    const totalSettled = parseFloat(summary.totalSettled || '0');

    const pendingAmount = totalDeducted - totalSettled;

    // P1 FIX (AS-17/AS-11): 关联查询责任方名称并计算动态限额
    let partyName = '未知责任方';
    let maxAllowed: number = DEDUCTION_SAFETY_CONFIG.DEFAULT_MAX_DEDUCTION;

    if (partyType === 'FACTORY') {
        const supplier = await db.query.suppliers.findFirst({
            where: and(eq(suppliers.id, partyId), eq(suppliers.tenantId, tenantId)),
            columns: { name: true }
        });
        partyName = supplier?.name || '未知供应商';

        // P1 FIX (AS-11): 动态计算供应商限额 = 历史采购总额 * 10%
        const [poSummary] = await db
            .select({ total: sum(sql`CAST(${purchaseOrders.totalAmount} AS DECIMAL)`) })
            .from(purchaseOrders)
            .where(and(
                eq(purchaseOrders.supplierId, partyId),
                eq(purchaseOrders.tenantId, tenantId),
                sql`${purchaseOrders.status} != 'CANCELED'`
            ));

        const historicalPurchaseAmount = Number(poSummary?.total || 0);
        maxAllowed = Math.max(
            DEDUCTION_SAFETY_CONFIG.DEFAULT_MAX_DEDUCTION,
            historicalPurchaseAmount * DEDUCTION_SAFETY_CONFIG.SUPPLIER_MAX_RATIO
        );
    } else if (partyType === 'INSTALLER') {
        const user = await db.query.users.findFirst({
            where: and(eq(users.id, partyId), eq(users.tenantId, tenantId)),
            columns: { name: true }
        });
        partyName = user?.name || '未知安装工';
        maxAllowed = DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION;
    } else if (partyType === 'MEASURER') {
        const user = await db.query.users.findFirst({
            where: and(eq(users.id, partyId), eq(users.tenantId, tenantId)),
            columns: { name: true }
        });
        partyName = user?.name || '未知测量员';
        maxAllowed = DEDUCTION_SAFETY_CONFIG.MEASURER_MAX_DEDUCTION;
    } else if (partyType === 'LOGISTICS') {
        const supplier = await db.query.suppliers.findFirst({
            where: and(eq(suppliers.id, partyId), eq(suppliers.tenantId, tenantId)),
            columns: { name: true }
        });
        partyName = supplier?.name || '未知物流公司';
        maxAllowed = DEDUCTION_SAFETY_CONFIG.LOGISTICS_MAX_DEDUCTION;
    } else if (partyType === 'CUSTOMER') {
        const customer = await db.query.customers.findFirst({
            where: and(eq(customers.id, partyId), eq(customers.tenantId, tenantId)),
            columns: { name: true }
        });
        partyName = customer?.name || '未知客户';
        maxAllowed = 9999999; // 客户无实际"欠款"限制
    } else if (partyType === 'COMPANY') {
        partyName = '公司内部';
        maxAllowed = 9999999; // 公司内部无限制
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
        partyName, // P1 FIX: 已补充名称
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
    partyType: LiablePartyType,
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

    // 2. 批量拉取责任方名称和相关限额数据
    const ledgers: DeductionLedger[] = [];

    // 按类型分组以方便批量查询
    const partyGroups: Record<string, string[]> = {};
    result.forEach(r => {
        if (r.partyType && r.partyId) {
            if (!partyGroups[r.partyType]) partyGroups[r.partyType] = [];
            partyGroups[r.partyType].push(r.partyId);
        }
    });

    // 批量拉取名称映射
    const nameMap: Record<string, string> = {};

    // 工厂 (供应商)
    if (partyGroups['FACTORY']?.length) {
        const factoryData = await db.query.suppliers.findMany({
            where: and(eq(suppliers.tenantId, tenantId), sql`${suppliers.id} IN ${partyGroups['FACTORY']}`),
            columns: { id: true, name: true }
        });
        factoryData.forEach(d => nameMap[`FACTORY:${d.id}`] = d.name);
    }

    // 安装工 & 测量员 (用户)
    const userIds = [...(partyGroups['INSTALLER'] || []), ...(partyGroups['MEASURER'] || [])];
    if (userIds.length) {
        const userData = await db.query.users.findMany({
            where: and(eq(users.tenantId, tenantId), sql`${users.id} IN ${userIds}`),
            columns: { id: true, name: true }
        });
        userData.forEach(d => {
            if (partyGroups['INSTALLER']?.includes(d.id)) nameMap[`INSTALLER:${d.id}`] = d.name ?? '未知';
            if (partyGroups['MEASURER']?.includes(d.id)) nameMap[`MEASURER:${d.id}`] = d.name ?? '未知';
        });
    }

    // 物流
    if (partyGroups['LOGISTICS']?.length) {
        const logisticsData = await db.query.suppliers.findMany({
            where: and(eq(suppliers.tenantId, tenantId), sql`${suppliers.id} IN ${partyGroups['LOGISTICS']}`),
            columns: { id: true, name: true }
        });
        logisticsData.forEach(d => nameMap[`LOGISTICS:${d.id}`] = d.name ?? '未知');
    }

    // 客户
    if (partyGroups['CUSTOMER']?.length) {
        const customerData = await db.query.customers.findMany({
            where: and(eq(customers.tenantId, tenantId), sql`${customers.id} IN ${partyGroups['CUSTOMER']}`),
            columns: { id: true, name: true }
        });
        customerData.forEach(d => nameMap[`CUSTOMER:${d.id}`] = d.name ?? '未知');
    }

    // 3. 批量拉取供应商采购历史 (用于动态限额)
    const poHistoryMap: Record<string, number> = {};
    if (partyGroups['FACTORY']?.length) {
        const poSummaries = await db
            .select({
                supplierId: purchaseOrders.supplierId,
                total: sum(sql`CAST(${purchaseOrders.totalAmount} AS DECIMAL)`)
            })
            .from(purchaseOrders)
            .where(and(
                eq(purchaseOrders.tenantId, tenantId),
                sql`${purchaseOrders.supplierId} IN ${partyGroups['FACTORY']}`,
                sql`${purchaseOrders.status} != 'CANCELED'`
            ))
            .groupBy(purchaseOrders.supplierId);

        poSummaries.forEach(s => {
            if (s.supplierId) poHistoryMap[s.supplierId] = Number(s.total || 0);
        });
    }

    // 4. 组装最终结果
    for (const r of result) {
        if (!r.partyType || !r.partyId) continue;

        const totalDeducted = parseFloat(r.totalDeducted || '0');
        const totalSettled = parseFloat(r.totalSettled || '0');
        const pendingAmount = totalDeducted - totalSettled;
        const partyKey = `${r.partyType}:${r.partyId}`;

        let maxAllowed: number = DEDUCTION_SAFETY_CONFIG.DEFAULT_MAX_DEDUCTION;
        if (r.partyType === 'FACTORY') {
            const history = poHistoryMap[r.partyId] || 0;
            maxAllowed = Math.max(DEDUCTION_SAFETY_CONFIG.DEFAULT_MAX_DEDUCTION, history * DEDUCTION_SAFETY_CONFIG.SUPPLIER_MAX_RATIO);
        } else if (r.partyType === 'INSTALLER') {
            maxAllowed = DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION;
        } else if (r.partyType === 'MEASURER') {
            maxAllowed = DEDUCTION_SAFETY_CONFIG.MEASURER_MAX_DEDUCTION;
        } else if (r.partyType === 'LOGISTICS') {
            maxAllowed = DEDUCTION_SAFETY_CONFIG.LOGISTICS_MAX_DEDUCTION;
        } else if (r.partyType === 'CUSTOMER' || r.partyType === 'COMPANY') {
            maxAllowed = 9999999;
        }

        const usedRatio = maxAllowed > 0 ? pendingAmount / maxAllowed : 0;
        let status: DeductionLedger['status'] = 'NORMAL';
        if (usedRatio >= 1) status = 'BLOCKED' as const;
        else if (usedRatio >= DEDUCTION_SAFETY_CONFIG.WARNING_THRESHOLD) status = 'WARNING' as const;

        ledgers.push({
            partyType: r.partyType as LiablePartyType,
            partyId: r.partyId,
            partyName: nameMap[partyKey] || (r.partyType === 'COMPANY' ? '公司内部' : '未知责任方'),
            totalDeducted,
            totalSettled,
            pendingAmount,
            maxAllowed,
            usedRatio,
            status,
        });
    }

    return ledgers;
}
