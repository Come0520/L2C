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
 */
export async function getTenantInfo(session: Session): Promise<{
    success: boolean;
    data?: TenantInfoDTO;
    error?: string;
}> {
    try {
        await checkPermission(session, PERMISSIONS.ADMIN.SETTINGS);

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
 */
export async function getMfaConfig(session: Session): Promise<{
    success: boolean;
    data?: MfaConfigDTO;
    error?: string;
}> {
    try {
        await checkPermission(session, PERMISSIONS.ADMIN.SETTINGS);

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
 * 更新租户基本信息
 */
const updateTenantInfoInternal = createSafeAction(updateTenantInfoSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.ADMIN.TENANT_MANAGE);

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

    revalidatePath('/admin/settings');
    return { success: true, data: updated };
});

export async function updateTenantInfo(params: z.infer<typeof updateTenantInfoSchema>) {
    return updateTenantInfoInternal(params);
}

/**
 * 更新 MFA 配置（写入 settings.mfa jsonb）
 */
const updateMfaConfigInternal = createSafeAction(updateMfaConfigSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.ADMIN.SETTINGS);

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

    revalidatePath('/admin/settings/security');
    return { success: true, data: updated };
});

export async function updateMfaConfig(params: z.infer<typeof updateMfaConfigSchema>) {
    return updateMfaConfigInternal(params);
}
