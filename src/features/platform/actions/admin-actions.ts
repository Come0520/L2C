'use server';

/**
 * 平台管理员操作 Server Actions
 * 
 * 提供平台级别的租户管理功能，仅限超级管理员使用
 */

import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { eq, desc } from 'drizzle-orm';
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

        const allTenants = await db.query.tenants.findMany({
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

        return {
            success: true,
            data: {
                tenants: allTenants,
                total: allTenants.length
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
            // 1. 更新租户状态为已激活
            await tx.update(tenants)
                .set({
                    status: 'active',
                    isActive: true,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            // 2. 激活该租户下的所有用户
            await tx.update(users)
                .set({
                    isActive: true,
                    updatedAt: new Date(),
                })
                .where(eq(users.tenantId, tenantId));
        });

        // 发送审批通过通知（微信订阅消息）
        notifyTenantApproved(tenantId).catch(err => {
            console.error('发送微信审批通知失败:', err);
        });

        return { success: true };
    } catch (error) {
        console.error('审批通过失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
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

        await db.update(tenants)
            .set({
                status: 'rejected',
                rejectReason: reason.trim(),
                reviewedBy: adminId,
                reviewedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));

        // 发送拒绝通知（微信订阅消息）
        notifyTenantRejected(tenantId, reason).catch(err => {
            console.error('发送微信拒绝通知失败:', err);
        });

        return { success: true };
    } catch (error) {
        console.error('拒绝申请失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
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
        await requirePlatformAdmin();

        await db.update(tenants)
            .set({
                status: 'suspended',
                isActive: false,
                rejectReason: reason || '账户已被暂停',
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));

        return { success: true };
    } catch (error) {
        console.error('暂停租户失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}

/**
 * 恢复租户
 */
export async function activateTenant(tenantId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        await requirePlatformAdmin();

        await db.update(tenants)
            .set({
                status: 'active',
                isActive: true,
                rejectReason: null,
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));

        return { success: true };
    } catch (error) {
        console.error('恢复租户失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}
