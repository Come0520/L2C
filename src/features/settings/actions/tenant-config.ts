'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * 租户业务配置相关类型和Server Actions
 */

// 收款规则配置类型
export interface ARPaymentConfig {
    enableInstallment: boolean;       // 是否允许分期
    minDepositRatio: number;          // 定金最低比例 (0-1)
    minDepositAmount: number;         // 定金最低金额
    depositCalcRule: 'HIGHER' | 'LOWER' | 'RATIO_ONLY' | 'AMOUNT_ONLY';
    allowDebtInstallCash: boolean;    // 现结客户是否允许欠款安装
    requireDebtInstallApproval: boolean; // 欠款安装是否需审批
}

// 付款策略配置类型
export interface APPaymentConfig {
    prepaidBonusType: 'BALANCE' | 'GOODS';  // 预存赠送方式
    prepaidBonusRatio: number;               // 赠送货款比例 (0-1)
}

// 业务流程模式配置类型
export interface WorkflowModeConfig {
    enableLeadAssignment: boolean;    // 启用线索分配
    measureDispatchMode: 'SELF' | 'DISPATCHER' | 'SALES';  // 测量派单模式
    installDispatchMode: 'SELF' | 'DISPATCHER' | 'SALES';  // 安装派单模式
    enableLaborFeeCalc: boolean;      // 启用劳务费用计算
    enableOutsourceProcessing: boolean; // 启用外发加工
    enablePurchaseApproval: boolean;  // 启用采购审批
}

// 完整租户业务配置类型
export interface TenantBusinessConfig {
    arPayment: ARPaymentConfig;
    apPayment: APPaymentConfig;
    workflowMode: WorkflowModeConfig;
}

// 默认配置
const DEFAULT_AR_CONFIG: ARPaymentConfig = {
    enableInstallment: true,
    minDepositRatio: 0.30,
    minDepositAmount: 500,
    depositCalcRule: 'HIGHER',
    allowDebtInstallCash: false,
    requireDebtInstallApproval: true,
};

const DEFAULT_AP_CONFIG: APPaymentConfig = {
    prepaidBonusType: 'BALANCE',
    prepaidBonusRatio: 0.10,
};

const DEFAULT_WORKFLOW_CONFIG: WorkflowModeConfig = {
    enableLeadAssignment: true,
    measureDispatchMode: 'DISPATCHER',
    installDispatchMode: 'DISPATCHER',
    enableLaborFeeCalc: true,
    enableOutsourceProcessing: true,
    enablePurchaseApproval: true,
};

// Zod Schemas
const arPaymentSchema = z.object({
    enableInstallment: z.boolean(),
    minDepositRatio: z.number().min(0).max(1),
    minDepositAmount: z.number().min(0),
    depositCalcRule: z.enum(['HIGHER', 'LOWER', 'RATIO_ONLY', 'AMOUNT_ONLY']),
    allowDebtInstallCash: z.boolean(),
    requireDebtInstallApproval: z.boolean(),
});

const apPaymentSchema = z.object({
    prepaidBonusType: z.enum(['BALANCE', 'GOODS']),
    prepaidBonusRatio: z.number().min(0).max(1),
});

const workflowModeSchema = z.object({
    enableLeadAssignment: z.boolean(),
    measureDispatchMode: z.enum(['SELF', 'DISPATCHER', 'SALES']),
    installDispatchMode: z.enum(['SELF', 'DISPATCHER', 'SALES']),
    enableLaborFeeCalc: z.boolean(),
    enableOutsourceProcessing: z.boolean(),
    enablePurchaseApproval: z.boolean(),
});

/**
 * 获取租户业务配置
 */
export async function getTenantBusinessConfig(): Promise<TenantBusinessConfig> {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return {
            arPayment: DEFAULT_AR_CONFIG,
            apPayment: DEFAULT_AP_CONFIG,
            workflowMode: DEFAULT_WORKFLOW_CONFIG,
        };
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: { settings: true },
    });

    const settings = (tenant?.settings as Record<string, unknown>) || {};

    return {
        arPayment: { ...DEFAULT_AR_CONFIG, ...(settings.arPayment as Partial<ARPaymentConfig>) },
        apPayment: { ...DEFAULT_AP_CONFIG, ...(settings.apPayment as Partial<APPaymentConfig>) },
        workflowMode: { ...DEFAULT_WORKFLOW_CONFIG, ...(settings.workflowMode as Partial<WorkflowModeConfig>) },
    };
}

/**
 * 更新收款规则配置
 */
export async function updateARPaymentConfig(config: ARPaymentConfig) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    // 权限校验：需要设置管理权限
    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

    const validated = arPaymentSchema.safeParse(config);
    if (!validated.success) {
        return { success: false, error: validated.error.message };
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    await db.update(tenants)
        .set({
            settings: {
                ...currentSettings,
                arPayment: validated.data,
            },
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, session.user.tenantId));

    revalidatePath('/settings/finance/ar');
    return { success: true };
}

/**
 * 更新付款策略配置
 */
export async function updateAPPaymentConfig(config: APPaymentConfig) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    // 权限校验：需要设置管理权限
    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

    const validated = apPaymentSchema.safeParse(config);
    if (!validated.success) {
        return { success: false, error: validated.error.message };
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    await db.update(tenants)
        .set({
            settings: {
                ...currentSettings,
                apPayment: validated.data,
            },
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, session.user.tenantId));

    revalidatePath('/settings/finance/ap');
    return { success: true };
}

/**
 * 更新业务流程模式配置
 */
export async function updateWorkflowModeConfig(config: WorkflowModeConfig) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    // 权限校验：需要设置管理权限
    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

    const validated = workflowModeSchema.safeParse(config);
    if (!validated.success) {
        return { success: false, error: validated.error.message };
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    await db.update(tenants)
        .set({
            settings: {
                ...currentSettings,
                workflowMode: validated.data,
            },
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, session.user.tenantId));

    revalidatePath('/settings/workflow');
    return { success: true };
}
