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
import { z } from 'zod';
import {
    notifyTenantApproved,
    notifyTenantRejected
} from '@/services/wechat-subscribe-message.service';
import { logger } from '@/shared/lib/logger';
import { AuditService } from '@/shared/services/audit-service';
import { unstable_cache, revalidateTag } from 'next/cache';

// ============ 验证 Schema ============

/** ID 校验模式 (兼容现有测试用的非 UUID 字符串) */
const idSchema = z.string().min(1, 'ID 不能为空');

/** 审核及拒绝原因校验模式 */
const rejectReasonSchema = z.string().trim().min(1, '请填写原因（包含该项的拒绝原因或驳回原因）').max(500, '理由过长 (最多500字符)');

/** 分页参数校验模式 */
const paginationSchema = z.object({
    status: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(10),
});

// ============ 类型定义 ============

/** 待审批租户简略信息 */
export interface PendingTenant {
    /** 租户 UUID */
    id: string;
    /** 企业/校区名称 */
    name: string;
    /** 唯一的租户助记码 */
    code: string;
    /** 申请人姓名 */
    applicantName: string | null;
    /** 申请人联系电话 */
    applicantPhone: string | null;
    /** 申请人联系邮箱 */
    applicantEmail: string | null;
    /** 企业所属地区 */
    region: string | null;
    /** 业务背景描述 */
    businessDescription: string | null;
    /** 申请提交时间 */
    createdAt: Date | null;
    /** 租户状态 */
    status: string;
}

// ============ 权限验证 ============

/**
 * 验证当前用户是否具备平台超级管理员权限
 * 
 * 鉴权流程：
 * 1. 检查 Session 登录态
 * 2. 验证 `users` 表中的 `isPlatformAdmin` 标识
 * 
 * @returns {Promise<string>} 认证成功的管理员用户 ID
 * @throws {Error} 未通过权限验证时抛出异常
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
 * 分页获取处于“待审批”状态的租户列表
 * 
 * @param {Object} options - 查询选项
 * @param {string} [options.search] - 搜索关键字(名称/编码/申请人/手机号)
 * @returns {Promise<{success: boolean; data?: PendingTenant[]; error?: string;}>} 待处理列表
 */
export async function getPendingTenants(options?: {
    search?: string;
}): Promise<{
    success: boolean;
    data?: PendingTenant[];
    error?: string;
}> {
    try {
        await requirePlatformAdmin();
        const { search } = options || {};

        let whereCondition = eq(tenants.status, 'pending_approval');
        if (search) {
            whereCondition = sql`${whereCondition} AND (
                ${tenants.name} LIKE ${`%${search}%`} OR 
                ${tenants.code} LIKE ${`%${search}%`} OR 
                ${tenants.applicantName} LIKE ${`%${search}%`} OR 
                ${tenants.applicantPhone} LIKE ${`%${search}%`}
            )`;
        }

        const pendingList = await db.query.tenants.findMany({
            where: whereCondition,
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
                status: true,
            },
            orderBy: desc(tenants.createdAt),
        });

        return { success: true, data: pendingList };
    } catch (error) {
        logger.error('获取待审批列表失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败'
        };
    }
}

/**
 * 分页获取系统中所有的租户列表
 * 
 * 性能优化：使用 `unstable_cache` 缓存策略，每 60 秒自动刷新。支持强制标签刷新。
 * 
 * @param {Object} options - 查询选项
 * @param {string} [options.status] - 按租户状态筛选 (active, suspended, rejected等)
 * @param {string} [options.search] - 搜索关键字
 * @returns {Promise<{success: boolean; data?: {tenants: PendingTenant[]; total: number;}; error?: string;}>}
 */
export async function getAllTenants(options?: {
    status?: string;
    search?: string;
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

        // 验证分页参数
        const { page, pageSize } = paginationSchema.parse(options || {});
        const offset = (page - 1) * pageSize;
        const { search, status } = options || {};

        // 使用 unstable_cache 缓存列表查询，60s 过期
        const cacheKey = `all-tenants-${page}-${pageSize}-${search || ''}-${status || ''}`;

        const data = await unstable_cache(
            async () => {
                const whereConditions = [];

                if (status) {
                    whereConditions.push(sql`${tenants.status} = ${status}`);
                }

                if (search) {
                    whereConditions.push(sql`(${tenants.name} LIKE ${`%${search}%`} OR ${tenants.code} LIKE ${`%${search}%`} OR ${tenants.applicantName} LIKE ${`%${search}%`} OR ${tenants.applicantPhone} LIKE ${`%${search}%`})`);
                }

                const whereClause = whereConditions.length > 0
                    ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
                    : sql``;

                const [[{ count }], list] = await Promise.all([
                    db.execute(sql`SELECT count(*) as count FROM ${tenants} ${whereClause}`),
                    db.query.tenants.findMany({
                        where: whereConditions.length > 0 ? sql.join(whereConditions, sql` AND `) : undefined,
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
                            status: true,
                        },
                        limit: pageSize,
                        offset: offset,
                        orderBy: desc(tenants.createdAt),
                    })
                ]);
                const total = Number(count);

                return { tenants: list, total };
            },
            [cacheKey],
            { tags: ['platform-tenants'], revalidate: 60 }
        )();

        return { success: true, data };
    } catch (error) {
        logger.error('获取租户列表失败:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: '参数校验失败: ' + error.issues[0].message };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败'
        };
    }
}


/**
 * 审批通过租户申请
 * 
 * 操作流程：
 * 1. 【校验】验证 tenantId 格式合法
 * 2. 【事务】将租户状态改为 `active`，激活对应的 BOSS 账号
 * 3. 【审计】记录 UPDATE 操作记录
 * 4. 【异步通知】触发微信或邮件通知租户申请人
 * 
 * @param {string} tenantId - 租户 UUID
 * @returns {Promise<{success: boolean; error?: string;}>} 结果
 */
export async function approveTenant(tenantId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        idSchema.parse(tenantId);
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
            await AuditService.log(tx, {
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { status: 'active', isActive: true },
                newValues: { status: 'active', isActive: true },
            });
        });

        // 清除租户列表缓存，确保前端 router.refresh() 能立即看到最新状态
        revalidateTag('platform-tenants', {});

        notifyTenantApproved(tenantId).catch(err => {
            logger.error('发送通知失败:', err);
        });

        return { success: true };
    } catch (error) {
        logger.error('审批记录失败:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: '无效请求参数' };
        }
        return { success: false, error: error instanceof Error ? error.message : '操作失败' };
    }
}

/**
 * 拒绝租户申请
 * 
 * 要求必须填写明确的拒绝理由，该理由将同步发给申请人。
 * 
 * @param {string} tenantId - 租户 UUID
 * @param {string} reason - 拒绝理由
 * @returns {Promise<{success: boolean; error?: string;}>} 结果
 */
export async function rejectTenant(
    tenantId: string,
    reason: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        idSchema.parse(tenantId);
        rejectReasonSchema.parse(reason);
        const adminId = await requirePlatformAdmin();

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

            await AuditService.log(tx, {
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { status: 'rejected', rejectReason: reason.trim() },
            });
        });

        // 清除租户列表缓存
        revalidateTag('platform-tenants', {});

        notifyTenantRejected(tenantId, reason).catch(err => {
            logger.error('发送通知失败:', err);
        });

        return { success: true };
    } catch (error) {
        logger.error('拒绝申请失败:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: error instanceof Error ? error.message : '操作失败' };
    }
}

/**
 * 暂停租户账户 (冻结)
 * 
 * 暂停后，该租户及其下属所有用户将无法登录系统，API 访问也将被拦截。
 * 
 * @param {string} tenantId - 租户 UUID
 * @param {string} [reason] - 暂停原因说明
 * @returns {Promise<{success: boolean; error?: string;}>} 结果
 */
export async function suspendTenant(
    tenantId: string,
    reason?: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        idSchema.parse(tenantId);
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
            await AuditService.log(tx, {
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { status: 'suspended', isActive: false },
                newValues: { status: 'suspended', isActive: false, reason },
            });
        });

        // 清除租户列表缓存
        revalidateTag('platform-tenants', {});

        return { success: true };
    } catch (error) {
        logger.error('暂停租户失败:', error);
        if (error instanceof z.ZodError) return { success: false, error: '无效请求参数' };
        return { success: false, error: error instanceof Error ? error.message : '操作失败' };
    }
}

/**
 * 恢复租户 (解除暂停)
 * 
 * 恢复后，租户状态变为 `active`，下属所有用户账号将同步恢复为 `isActive: true`，恢复正常登录及 API 访问。
 * 
 * @param {string} tenantId - 租户 UUID
 * @returns {Promise<{success: boolean; error?: string;}>} 结果
 */
export async function activateTenant(tenantId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        idSchema.parse(tenantId);
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
            await AuditService.log(tx, {
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { status: 'active', isActive: true },
                newValues: { status: 'active', isActive: true },
            });
        });

        // 清除租户列表缓存
        revalidateTag('platform-tenants', {});

        return { success: true };
    } catch (error) {
        logger.error('恢复租户失败:', error);
        if (error instanceof z.ZodError) return { success: false, error: '无效请求参数' };
        return { success: false, error: error instanceof Error ? error.message : '操作失败' };
    }
}

// ============ 企业认证审核 Actions ============

/** 待企业资质认证审核的租户信息接口 */
export interface VerificationPendingTenant {
    /** 租户 UUID */
    id: string;
    /** 企业名称 */
    name: string;
    /** 租户助记码 */
    code: string;
    /** 企业 Logo 地址 */
    logoUrl: string | null;
    /** 法定代表人姓名 */
    legalRepName: string | null;
    /** 注册资本 */
    registeredCapital: string | null;
    /** 经营范围简述 */
    businessScope: string | null;
    /** 营业执照扫描件 OSS 地址 */
    businessLicenseUrl: string | null;
    /** 注册时间 */
    createdAt: Date | null;
}

/**
 * 分页获取目前处于“待企业认证审核”状态的租户列表
 * 
 * 只有具备 `pending` 认证状态的租户才会出现在此列表中。
 * 
 * @returns {Promise<{success: boolean; data?: VerificationPendingTenant[]; error?: string;}>}
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
        logger.error('获取待认证列表失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败'
        };
    }
}

/**
 * 通过租户的企业资质认证
 * 
 * 操作结果：
 * - `verificationStatus` 变为 `verified`
 * - 记录审核人及审核时间
 * - 记录审计日志
 * 
 * @param {string} tenantId - 租户 UUID
 * @returns {Promise<{success: boolean; error?: string;}>}
 */
export async function approveVerification(tenantId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        idSchema.parse(tenantId);
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
            await AuditService.log(tx, {
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { verificationStatus: 'verified' },
                newValues: { verificationStatus: 'verified' },
            });
        });

        return { success: true };
    } catch (error) {
        logger.error('认证通过失败:', error);
        if (error instanceof z.ZodError) return { success: false, error: '无效请求参数' };
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}

/**
 * 驳回租户的企业资质认证
 * 
 * 要求必须填写驳回原因，用于指导租户修改资质重新提交。
 * 
 * @param {string} tenantId - 租户 UUID
 * @param {string} reason - 驳回原因简述
 * @returns {Promise<{success: boolean; error?: string;}>}
 */
export async function rejectVerification(
    tenantId: string,
    reason: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        idSchema.parse(tenantId);
        rejectReasonSchema.parse(reason);
        const adminId = await requirePlatformAdmin();

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
            await AuditService.log(tx, {
                tenantId,
                userId: adminId,
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                changedFields: { verificationStatus: 'rejected', verificationRejectReason: reason.trim() },
            });
        });

        return { success: true };
    } catch (error) {
        logger.error('认证驳回失败:', error);
        if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}
