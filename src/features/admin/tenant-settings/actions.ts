'use server';

/**
 * 租户设置模块
 * 提供：租户基本信息修改、MFA 配置管理
 * 权限要求：admin.tenant / admin.settings
 */

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { createSafeAction } from '@/shared/lib/server-action';
import { AuditService } from '@/shared/services/audit-service';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { AdminRateLimiter } from '../rate-limiter';
import type { Session } from 'next-auth';

// ========== Zod Schema ==========

/** 更新租户基本信息（字段对应 tenants 表实际列名） */
const updateTenantInfoSchema = z.object({
    name: z.string().min(1, '租户名称不能为空').max(100, '名称最长 100 字符').optional(),
    logoUrl: z.string().url('Logo 必须为有效 URL').nullable().optional(),
    applicantName: z.string().max(100, '联系人名称最长 100 字符').optional(),
    applicantPhone: z.string().regex(/^1\d{10}$/, '手机号格式不正确').optional().or(z.literal('')),
    applicantEmail: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
    region: z.string().max(100, '地区最长 100 字符').optional(),
    businessDescription: z.string().max(500, '描述最长 500 字符').optional(),
});

/** MFA 配置（存储在 tenants.settings jsonb 中） */
const updateMfaConfigSchema = z.object({
    enabled: z.boolean(),
    /** 适用的角色列表（为空表示全员启用） */
    applicableRoles: z.array(z.string()).optional(),
    /** MFA 方式：totp / sms */
    method: z.enum(['totp', 'sms']).optional(),
});

// ========== 类型定义 ==========

export interface TenantInfoDTO {
    id: string;
    name: string;
    logoUrl: string | null;
    applicantName: string | null;
    applicantPhone: string | null;
    applicantEmail: string | null;
    region: string | null;
    status: string;
    createdAt: Date | null;
}

export interface MfaConfigDTO {
    enabled: boolean;
    applicableRoles: string[];
    method: string;
}

// ========== 查询 Action ==========

/**
 * 获取租户基本信息
 * 
 * @param session 当前用户会话
 * @returns 返回租户信息 DTO 或错误信息
 * @throws 权限不足时抛出异常
 */
export async function getTenantInfo(session: Session): Promise<{
    success: boolean;
    data?: TenantInfoDTO;
    error?: string;
}> {
    try {
        if (!(await checkPermission(session, PERMISSIONS.ADMIN.SETTINGS))) {
            throw new Error('权限不足：无法访问租户信息');
        }

        logger.info(`[Admin] 用户 ${session.user.id} 正在查询租户 ${session.user.tenantId} 的基本信息`);

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, session.user.tenantId),
        });

        if (!tenant) {
            return { success: false, error: '租户不存在' };
        }

        return {
            success: true,
            data: {
                id: tenant.id,
                name: tenant.name,
                logoUrl: tenant.logoUrl || null,
                applicantName: tenant.applicantName || null,
                applicantPhone: tenant.applicantPhone || null,
                applicantEmail: tenant.applicantEmail || null,
                region: tenant.region || null,
                status: tenant.status,
                createdAt: tenant.createdAt,
            },
        };
    } catch (error) {
        logger.error('getTenantInfo error:', error);
        return { success: false, error: error instanceof Error ? error.message : '获取租户信息失败' };
    }
}

/**
 * 获取 MFA 配置（从 settings jsonb 读取）
 * 
 * @param session 当前用户会话
 * @returns 返回 MFA 配置 DTO 或错误信息
 */
export async function getMfaConfig(session: Session): Promise<{
    success: boolean;
    data?: MfaConfigDTO;
    error?: string;
}> {
    try {
        if (!(await checkPermission(session, PERMISSIONS.ADMIN.SETTINGS))) {
            throw new Error('权限不足：无法访问 MFA 配置');
        }

        logger.info(`[Admin] 用户 ${session.user.id} 正在查询租户 ${session.user.tenantId} 的 MFA 安全配置`);

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, session.user.tenantId),
            columns: { settings: true },
        });

        if (!tenant) {
            return { success: false, error: '租户不存在' };
        }

        // MFA 配置存储在 settings.mfa 中
        const settings = (tenant.settings as Record<string, unknown>) || {};
        const mfa = (settings.mfa as Partial<MfaConfigDTO>) || {};

        const config: MfaConfigDTO = {
            enabled: mfa.enabled || false,
            applicableRoles: mfa.applicableRoles || [],
            method: mfa.method || 'totp',
        };

        return { success: true, data: config };
    } catch (error) {
        logger.error('getMfaConfig error:', error);
        return { success: false, error: error instanceof Error ? error.message : '获取 MFA 配置失败' };
    }
}

// ========== 写入 Action ==========

/**
 * 更新租户基本信息（内部实现）
 * 
 * 安全特性：
 * 1. 租户隔离：仅允许修改当前会话所属租户
 * 2. 字段校验：严格验证名称、联系方式、URL 等格式
 * 3. 审计留痕：同步记录旧值与新值的变更描述
 * 
 * @param data 更新参数，符合 updateTenantInfoSchema
 * @param context 包含 session 的上下文对象
 */
const updateTenantInfoInternal = createSafeAction(updateTenantInfoSchema, async (data, { session }) => {
    if (!(await checkPermission(session, PERMISSIONS.ADMIN.TENANT_MANAGE))) {
        throw new Error('权限不足：无法更新租户基本信息');
    }
    await AdminRateLimiter.check(session.user.id, 'tenant_mutation');

    // 查询旧值
    const oldTenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
    });

    if (!oldTenant) throw new Error('租户不存在');

    const [updated] = await db.update(tenants)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, session.user.tenantId))
        .returning();

    // 审计日志
    await AuditService.log(db, {
        action: 'UPDATE',
        tableName: 'tenants',
        recordId: session.user.tenantId,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: {
            name: oldTenant.name,
            logoUrl: oldTenant.logoUrl,
            applicantName: oldTenant.applicantName,
        },
        newValues: data as Record<string, unknown>,
    });

    logger.info(`[Admin] 用户 ${session.user.id} 更新了租户 ${session.user.tenantId} 的基本信息: ${Object.keys(data).join(', ')}`);

    revalidatePath('/admin/settings');
    return { success: true, data: updated };
});

export async function updateTenantInfo(params: z.infer<typeof updateTenantInfoSchema>) {
    return updateTenantInfoInternal(params);
}

/**
 * 更新 MFA 配置（内部实现）
 * 
 * 安全特性：
 * 1. JSONB 合并：确保只修改 settings 下的 mfa 路径
 * 2. 审计留痕：记录安全配置的开关状态及分级管理策略
 * 
 * @param data MFA 配置参数
 * @param context 包含 session 的上下文对象
 */
const updateMfaConfigInternal = createSafeAction(updateMfaConfigSchema, async (data, { session }) => {
    if (!(await checkPermission(session, PERMISSIONS.ADMIN.SETTINGS))) {
        throw new Error('权限不足：无法更新 MFA 设置');
    }
    await AdminRateLimiter.check(session.user.id, 'tenant_mutation');

    // 查询当前 settings
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: { settings: true },
    });

    if (!tenant) throw new Error('租户不存在');

    const currentSettings = (tenant.settings as Record<string, unknown>) || {};
    const oldMfa = currentSettings.mfa;

    const mfaConfig: MfaConfigDTO = {
        enabled: data.enabled,
        applicableRoles: data.applicableRoles || [],
        method: data.method || 'totp',
    };

    // 合并到 settings jsonb 中
    const newSettings = {
        ...currentSettings,
        mfa: mfaConfig,
    };

    const [updated] = await db.update(tenants)
        .set({
            settings: newSettings,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, session.user.tenantId))
        .returning();

    // 审计日志
    await AuditService.log(db, {
        action: 'UPDATE_MFA_CONFIG',
        tableName: 'tenants',
        recordId: session.user.tenantId,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: { mfa: oldMfa },
        newValues: { mfa: mfaConfig },
    });

    logger.info(`[Admin] 用户 ${session.user.id} 修改了租户 ${session.user.tenantId} 的 MFA 配置, 状态: ${mfaConfig.enabled ? '启用' : '禁用'}, 方式: ${mfaConfig.method}`);

    revalidatePath('/admin/settings/security');
    return { success: true, data: updated };
});

export async function updateMfaConfig(params: z.infer<typeof updateMfaConfigSchema>) {
    return updateMfaConfigInternal(params);
}
