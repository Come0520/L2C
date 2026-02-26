'use server';

import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { liabilityNotices } from '@/shared/api/schema/after-sales';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * 虚拟成本核算逻辑
 * 
 * 功能：
 * 1. 公司责任的会计科目分类
 * 2. 虚拟成本统计和分析
 * 3. 成本归因和部门分摊
 */

// 会计科目枚举（公司责任细分）
export const COST_ACCOUNT_CODES = {
    // 销售相关
    SALES_ERROR: { code: '6601.01', name: '销售差错损失', category: 'SALES' },
    SALES_PROMISE: { code: '6601.02', name: '销售过度承诺', category: 'SALES' },

    // 服务相关
    SERVICE_DELAY: { code: '6602.01', name: '服务延误赔偿', category: 'SERVICE' },
    SERVICE_QUALITY: { code: '6602.02', name: '服务质量问题', category: 'SERVICE' },

    // 产品相关
    PRODUCT_DEFECT: { code: '6603.01', name: '产品质量缺陷', category: 'PRODUCT' },
    PRODUCT_MISMATCH: { code: '6603.02', name: '产品规格不符', category: 'PRODUCT' },

    // 其他
    CUSTOMER_GOODWILL: { code: '6604.01', name: '客户关系维护', category: 'OTHER' },
    SYSTEM_ERROR: { code: '6604.02', name: '系统/流程错误', category: 'OTHER' },
    UNCLASSIFIED: { code: '6699.99', name: '其他损失', category: 'OTHER' },
} as const;

export type CostAccountCode = keyof typeof COST_ACCOUNT_CODES;

// 虚拟成本记录
export interface VirtualCostRecord {
    liabilityNoticeId: string;
    noticeNo: string;
    afterSalesId: string;
    accountCode: CostAccountCode;
    accountName: string;
    category: string;
    amount: number;
    description: string;
    confirmedAt: Date;
}

// 成本汇总
export interface CostSummary {
    totalAmount: number;
    byCategory: Record<string, number>;
    byAccount: Record<string, number>;
    trend: { month: string; amount: number }[];
}

/**
 * 获取公司责任的虚拟成本列表
 */
export async function getCompanyVirtualCosts(params?: {
    startDate?: string;
    endDate?: string;
}): Promise<VirtualCostRecord[]> {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    const tenantId = session.user.tenantId;
    const startDate = params?.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = params?.endDate ? new Date(params.endDate) : new Date();

    // 查询公司责任的定责单
    const notices = await db.query.liabilityNotices.findMany({
        where: and(
            eq(liabilityNotices.tenantId, tenantId),
            eq(liabilityNotices.liablePartyType, 'COMPANY'),
            eq(liabilityNotices.status, 'CONFIRMED'),
            gte(liabilityNotices.confirmedAt, startDate),
            lte(liabilityNotices.confirmedAt, endDate)
        ),
    });

    return notices.map(notice => {
        // 根据原因分类匹配会计科目
        const accountCode = mapReasonToAccountCode(notice.liabilityReasonCategory || '');
        const accountInfo = COST_ACCOUNT_CODES[accountCode];

        return {
            liabilityNoticeId: notice.id,
            noticeNo: notice.noticeNo,
            afterSalesId: notice.afterSalesId,
            accountCode,
            accountName: accountInfo.name,
            category: accountInfo.category,
            amount: Number(notice.amount || 0),
            description: notice.reason || '',
            confirmedAt: notice.confirmedAt || new Date(),
        };
    });
}

/**
 * 获取虚拟成本汇总
 */
export async function getVirtualCostSummary(params?: {
    startDate?: string;
    endDate?: string;
}): Promise<CostSummary> {
    const costs = await getCompanyVirtualCosts(params);

    const byCategory: Record<string, number> = {};
    const byAccount: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const cost of costs) {
        // 按类别汇总
        byCategory[cost.category] = (byCategory[cost.category] || 0) + cost.amount;

        // 按科目汇总
        byAccount[cost.accountName] = (byAccount[cost.accountName] || 0) + cost.amount;

        // 按月份汇总
        const month = cost.confirmedAt.toISOString().slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + cost.amount;
    }

    const totalAmount = costs.reduce((sum, c) => sum + c.amount, 0);

    const trend = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }));

    return {
        totalAmount,
        byCategory,
        byAccount,
        trend,
    };
}

/**
 * 根据原因分类映射到会计科目
 */
function mapReasonToAccountCode(reasonCategory: string): CostAccountCode {
    const mapping: Record<string, CostAccountCode> = {
        'SALES_ERROR': 'SALES_ERROR',
        'OVER_PROMISE': 'SALES_PROMISE',
        'DELAY': 'SERVICE_DELAY',
        'SERVICE_ISSUE': 'SERVICE_QUALITY',
        'PRODUCT_DEFECT': 'PRODUCT_DEFECT',
        'SPEC_MISMATCH': 'PRODUCT_MISMATCH',
        'CUSTOMER_RELATION': 'CUSTOMER_GOODWILL',
        'SYSTEM_ERROR': 'SYSTEM_ERROR',
    };

    return mapping[reasonCategory] || 'UNCLASSIFIED';
}

/**
 * 生成虚拟成本报表（导出用）
 */
export async function exportVirtualCostReport(params?: {
    startDate?: string;
    endDate?: string;
}): Promise<{
    headers: string[];
    rows: string[][];
}> {
    const costs = await getCompanyVirtualCosts(params);

    const headers = ['定责单号', '售后工单', '会计科目', '科目名称', '金额', '说明', '确认日期'];

    const rows = costs.map(c => [
        c.noticeNo,
        c.afterSalesId.slice(0, 8),
        COST_ACCOUNT_CODES[c.accountCode].code,
        c.accountName,
        c.amount.toFixed(2),
        c.description.slice(0, 50),
        c.confirmedAt.toISOString().slice(0, 10),
    ]);

    return { headers, rows };
}

/**
 * 按部门分摊虚拟成本
 */
export async function getVirtualCostByDepartment(params?: {
    startDate?: string;
    endDate?: string;
}): Promise<Record<string, { amount: number; count: number; percentage: number }>> {
    const costs = await getCompanyVirtualCosts(params);

    const totalAmount = costs.reduce((sum, c) => sum + c.amount, 0);

    const byDept: Record<string, { amount: number; count: number }> = {};

    for (const cost of costs) {
        // 根据类别映射到部门
        const dept = mapCategoryToDepartment(cost.category);
        if (!byDept[dept]) {
            byDept[dept] = { amount: 0, count: 0 };
        }
        byDept[dept].amount += cost.amount;
        byDept[dept].count += 1;
    }

    const result: Record<string, { amount: number; count: number; percentage: number }> = {};
    for (const [dept, data] of Object.entries(byDept)) {
        result[dept] = {
            ...data,
            percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        };
    }

    return result;
}

/**
 * 类别映射到部门
 */
function mapCategoryToDepartment(category: string): string {
    const mapping: Record<string, string> = {
        'SALES': '销售部',
        'SERVICE': '服务部',
        'PRODUCT': '采购部',
        'OTHER': '管理部',
    };
    return mapping[category] || '其他';
}
