'use server';

/**
 * 平台管理员操作 Server Actions
 * 
 * 提供平台级别的租户管理功能，仅限超级管理员使用
 */

import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { eq, desc, sql } from 'drizzle-orm';
import {
    notifyTenantApproved,
    notifyTenantRejected
} from '@/services/wechat-subscribe-message.service';

// ============ 类型定义 ============

export interface PendingTenant {
    id: string;
    name: string;
    code: string;
    applicantName: string | null;
    applicantPhone: string | null;
    applicantEmail: string | null;
    region: string | null;
    businessDescription: string | null;
    createdAt: Date | null;
}

// ============ 权限验证 ============

/**
 * 验证当前用户是否为平台管理员
 * @throws Error 如果用户未登录或无权限
 */
async function requirePlatformAdmin(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('未登录');
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { isPlatformAdmin: true },
    });

    if (!user?.isPlatformAdmin) {
        throw new Error('无平台管理权限');
    }

    return session.user.id;
}

// ============ Server Actions ============

/**
 * 获取待审批租户列表
 */
export async function getPendingTenants(): Promise<{
    success: boolean;
    data?: PendingTenant[];
    error?: string;
}> {
    try {
        await requirePlatformAdmin();

        const pendingList = await db.query.tenants.findMany({
            where: eq(tenants.status, 'pending_approval'),
            columns: {
                id: true,
                name: true,
                code: true,
                applicantName: true,
                applicantPhone: true,
                applicantEmail: true,
                region: true,
                businessDescription: true,
                createdAt: true,
            },
            orderBy: desc(tenants.createdAt),
        });

        return { success: true, data: pendingList };
    } catch (error) {
        console.error('获取待审批列表失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败'
        };
    }
}

/**
 * 获取所有租户列表（分页）
 */
export async function getAllTenants(options?: {
    status?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    success: boolean;
    data?: {
        tenants: PendingTenant[];
        total: number;
    };
    error?: string;
}> {
    try {
        await requirePlatformAdmin();

        const page = Math.max(1, options?.page || 1);
        const pageSize = Math.min(100, options?.pageSize || 10);
        const offset = (page - 1) * pageSize;

        // 1. 获取总数
        const [{ count }] = await db.execute(sql`SELECT count(*) as count FROM ${tenants}`);
        const total = Number(count);

        // 2. 获取分页数据
        const list = await db.query.tenants.findMany({
            columns: {
                id: true,
                name: true,
                code: true,
                applicantName: true,
                applicantPhone: true,
                applicantEmail: true,
                region: true,
                businessDescription: true,
                createdAt: true,
            },
            limit: pageSize,
            offset: offset,
            orderBy: desc(tenants.createdAt),
        });

        return {
            success: true,
            data: {
                tenants: list,
                total: total
            }
        };
    } catch (error) {
        console.error('获取租户列表失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败'
        };
    }
}

import { AuditService } from '@/shared/lib/audit-service';

/**
 * 审批通过租户申请
 */
export async function approveTenant(tenantId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const adminId = await requirePlatformAdmin();

        await db.transaction(async (tx) => {
            // 1. 前置状态校验
            const tenant = await tx.query.tenants.findFirst({
                where: eq(tenants.id, tenantId),
                columns: { status: true, name: true },
            });

            if (!tenant) throw new Error('租户不存在');
            if (tenant.status !== 'pending_approval') {
                throw new Error(`当前状态为 ${tenant.status}，无法执行审批`);
            }

            // 2. 更新租户状态
            await tx.update(tenants)
                .set({
                    status: 'active',
                    isActive: true,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            // 3. 激活所有用户
            await tx.update(users)
                .set({
                    isActive: true,
                    updatedAt: new Date(),
                })
                .where(eq(users.tenantId, tenantId));

            // 4. 记录审计日志
            await AuditService.record({
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { status: 'active', isActive: true },
                newValues: { status: 'active', isActive: true },
            }, tx);
        });

        notifyTenantApproved(tenantId).catch(err => {
            console.error('发送通知失败:', err);
        });

        return { success: true };
    } catch (error) {
        console.error('审批记录失败:', error);
        return { success: false, error: error instanceof Error ? error.message : '操作失败' };
    }
}

/**
 * 拒绝租户申请
 */
export async function rejectTenant(
    tenantId: string,
    reason: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const adminId = await requirePlatformAdmin();

        if (!reason || reason.trim().length === 0) {
            return { success: false, error: '请填写拒绝原因' };
        }

        await db.transaction(async (tx) => {
            const tenant = await tx.query.tenants.findFirst({
                where: eq(tenants.id, tenantId),
                columns: { status: true },
            });

            if (!tenant) throw new Error('租户不存在');
            if (tenant.status !== 'pending_approval') {
                throw new Error(`当前状态为 ${tenant.status}，无法执行拒绝`);
            }

            await tx.update(tenants)
                .set({
                    status: 'rejected',
                    rejectReason: reason.trim(),
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            await AuditService.record({
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { status: 'rejected', rejectReason: reason.trim() },
            }, tx);
        });

        notifyTenantRejected(tenantId, reason).catch(err => {
            console.error('发送通知失败:', err);
        });

        return { success: true };
    } catch (error) {
        console.error('拒绝申请失败:', error);
        return { success: false, error: error instanceof Error ? error.message : '操作失败' };
    }
}

/**
 * 暂停租户
 */
export async function suspendTenant(
    tenantId: string,
    reason?: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const adminId = await requirePlatformAdmin();

        await db.transaction(async (tx) => {
            // 1. 同步停用租户和该租户下的所有用户 (安全性增强)
            await tx.update(tenants)
                .set({
                    status: 'suspended',
                    isActive: false,
                    rejectReason: reason || '账户已被暂停',
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            await tx.update(users)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(eq(users.tenantId, tenantId));

            // 2. 记录审计日志
            await AuditService.record({
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { status: 'suspended', isActive: false },
                newValues: { status: 'suspended', isActive: false, reason },
            }, tx);
        });

        return { success: true };
    } catch (error) {
        console.error('暂停租户失败:', error);
        return { success: false, error: error instanceof Error ? error.message : '操作失败' };
    }
}

/**
 * 恢复租户 (解除暂停)
 */
export async function activateTenant(tenantId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const adminId = await requirePlatformAdmin();

        await db.transaction(async (tx) => {
            // 1. 前置状态校验
            const tenant = await tx.query.tenants.findFirst({
                where: eq(tenants.id, tenantId),
                columns: { status: true },
            });

            if (!tenant) throw new Error('租户不存在');
            if (tenant.status !== 'suspended') {
                throw new Error(`当前状态为 ${tenant.status}，无需恢复`);
            }

            // 2. 状态同步恢复
            await tx.update(tenants)
                .set({
                    status: 'active',
                    isActive: true,
                    rejectReason: null,
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            await tx.update(users)
                .set({
                    isActive: true,
                    updatedAt: new Date(),
                })
                .where(eq(users.tenantId, tenantId));

            // 3. 记录审计日志
            await AuditService.record({
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { status: 'active', isActive: true },
                newValues: { status: 'active', isActive: true },
            }, tx);
        });

        return { success: true };
    } catch (error) {
        console.error('恢复租户失败:', error);
        return { success: false, error: error instanceof Error ? error.message : '操作失败' };
    }
}

// ============ 企业认证审核 Actions ============

/** 待认证审核的租户信息 */
export interface VerificationPendingTenant {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
    legalRepName: string | null;
    registeredCapital: string | null;
    businessScope: string | null;
    businessLicenseUrl: string | null;
    createdAt: Date | null;
}

/**
 * 获取待企业认证审核列表
 */
export async function getVerificationPendingTenants(): Promise<{
    success: boolean;
    data?: VerificationPendingTenant[];
    error?: string;
}> {
    try {
        await requirePlatformAdmin();

        const pendingList = await db.query.tenants.findMany({
            where: eq(tenants.verificationStatus, 'pending'),
            columns: {
                id: true,
                name: true,
                code: true,
                logoUrl: true,
                legalRepName: true,
                registeredCapital: true,
                businessScope: true,
                businessLicenseUrl: true,
                createdAt: true,
            },
            orderBy: desc(tenants.updatedAt),
        });

        return { success: true, data: pendingList };
    } catch (error) {
        console.error('获取待认证列表失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败'
        };
    }
}

/**
 * 通过企业认证
 */
export async function approveVerification(tenantId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const adminId = await requirePlatformAdmin();

        await db.transaction(async (tx) => {
            // 1. 前置状态校验
            const tenant = await tx.query.tenants.findFirst({
                where: eq(tenants.id, tenantId),
                columns: { verificationStatus: true },
            });

            if (!tenant) throw new Error('租户不存在');
            if (tenant.verificationStatus !== 'pending') {
                throw new Error(`当前认证状态为 ${tenant.verificationStatus}，无法通过`);
            }

            // 2. 更新状态
            await tx.update(tenants)
                .set({
                    verificationStatus: 'verified',
                    verifiedBy: adminId,
                    verifiedAt: new Date(),
                    verificationRejectReason: null,
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            // 3. 记录审计日志
            await AuditService.record({
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { verificationStatus: 'verified' },
                newValues: { verificationStatus: 'verified' },
            }, tx);
        });

        return { success: true };
    } catch (error) {
        console.error('认证通过失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}

/**
 * 驳回企业认证
 */
export async function rejectVerification(
    tenantId: string,
    reason: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const adminId = await requirePlatformAdmin();

        if (!reason || reason.trim().length === 0) {
            return { success: false, error: '请填写驳回原因' };
        }

        await db.transaction(async (tx) => {
            // 1. 前置状态校验
            const tenant = await tx.query.tenants.findFirst({
                where: eq(tenants.id, tenantId),
                columns: { verificationStatus: true },
            });

            if (!tenant) throw new Error('租户不存在');
            if (tenant.verificationStatus !== 'pending') {
                throw new Error(`当前认证状态为 ${tenant.verificationStatus}，无法驳回`);
            }

            // 2. 更新状态
            await tx.update(tenants)
                .set({
                    verificationStatus: 'rejected',
                    verifiedBy: adminId,
                    verifiedAt: new Date(),
                    verificationRejectReason: reason.trim(),
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            // 3. 记录审计日志
            await AuditService.record({
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { verificationStatus: 'rejected', verificationRejectReason: reason.trim() },
            }, tx);
        });

        return { success: true };
    } catch (error) {
        console.error('认证驳回失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}
