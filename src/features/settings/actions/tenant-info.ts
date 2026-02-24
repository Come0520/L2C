'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';

/**
 * 租户基本信息管理 Server Actions
 * 提供查询、更新租户信息和上传 Logo 的功能
 */

import type { TenantInfo, TenantContactInfo, VerificationStatus, VerificationInfo } from '../types/tenant';

// ============ Zod 校验 Schema ============

const updateTenantInfoSchema = z.object({
    name: z.string().min(1, '企业名称不能为空').max(100),
    address: z.string().max(200).optional().default(''),
    phone: z.string().max(20).optional().default(''),
    email: z.string().email('邮箱格式不正确').optional().or(z.literal('')).default(''),
});

// ============ Server Actions ============

/**
 * 获取当前租户基本信息
 */
export async function getTenantInfo(): Promise<{ success: true; data: TenantInfo } | { success: false; error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未登录或无租户信息' };
        }

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, session.user.tenantId),
            columns: {
                id: true,
                name: true,
                code: true,
                logoUrl: true,
                settings: true,
            },
        });

        if (!tenant) {
            return { success: false, error: '租户不存在' };
        }

        const settings = (tenant.settings as Record<string, unknown>) || {};
        const contact = (settings.contact as TenantContactInfo) || {
            address: '',
            phone: '',
            email: '',
        };

        return {
            success: true,
            data: {
                id: tenant.id,
                name: tenant.name,
                code: tenant.code,
                logoUrl: tenant.logoUrl,
                contact,
            },
        };
    } catch {
        logger.error('获取租户信息失败:');
        return { success: false, error: '获取租户信息失败' };
    }
}

/**
 * 检查当前用户是否有编辑权限
 */
export async function canEditTenantInfo(): Promise<boolean> {
    try {
        const session = await auth();
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
        return true;
    } catch {
        return false;
    }
}

/**
 * 更新租户基本信息
 */
export async function updateTenantInfo(data: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未登录' };
        }

        // 权限校验
        try {
            await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
        } catch (_e) {
            return { success: false, error: '无权限执行此操作' };
        }

        // 输入校验
        const validated = updateTenantInfoSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0]?.message || '输入校验失败' };
        }

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        // 使用事务并锁定行，防止并发更新数据覆盖 (R3-07)
        await db.transaction(async (tx) => {
            // 获取并锁定当前 settings
            const tenant = await tx.select({ settings: tenants.settings })
                .from(tenants)
                .where(eq(tenants.id, tenantId))
                .for('update')
                .then(res => res[0]);

            const currentSettings = (tenant?.settings as Record<string, unknown>) || {};
            const oldContact = (currentSettings.contact as Record<string, unknown>) || {};

            // 更新数据库
            await tx.update(tenants)
                .set({
                    name: validated.data.name,
                    settings: {
                        ...currentSettings,
                        contact: {
                            address: validated.data.address || '',
                            phone: validated.data.phone || '',
                            email: validated.data.email || '',
                        },
                    },
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            // 记录审计日志
            await AuditService.log(tx, {
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE',
                userId,
                newValues: {
                    name: validated.data.name,
                    contact: {
                        address: validated.data.address,
                        phone: validated.data.phone,
                        email: validated.data.email,
                    }
                },
                oldValues: { contact: oldContact },
            });
        });

        revalidatePath('/settings/general');
        return { success: true };
    } catch (error) {
        logger.error('更新租户信息失败:', error);
        return { success: false, error: error instanceof Error ? error.message : '更新失败，请稍后重试' };
    }
}

/**
 * 上传租户 Logo
 */
export async function uploadTenantLogo(formData: FormData): Promise<{ success: true; logoUrl: string } | { success: false; error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未登录' };
        }

        // 权限校验
        try {
            await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
        } catch (_e) {
            return { success: false, error: '无权限执行此操作' };
        }

        const file = formData.get('logo') as File | null;
        if (!file) {
            return { success: false, error: '请选择图片文件' };
        }

        // 验证文件大小 (R3-01)
        const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_LOGO_SIZE) {
            return { success: false, error: '图片文件不能超过 2MB' };
        }

        // 验证文件类型
        // 验证文件类型和大小
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return { success: false, error: '只支持 JPG, PNG, WEBP 格式图片' };
        }
        if (file.size > 2 * 1024 * 1024) {
            return { success: false, error: 'Logo 文件大小不能超过 2MB' };
        }

        const tenantId = session.user.tenantId;
        const extension = file.name.split('.').pop() || 'png';
        const fileName = `${tenantId}-${Date.now()}.${extension}`;

        /**
         * [!WARNING]
         * 生产环境架构建议：
         * 当前实现使用本地文件系统 (fs) 存储 Logo。在 Serverless (如 Vercel) 或负载均衡环境下，
         * 本地存储是临时且非共享的。
         * 建议：在生产环境中，请将此处的逻辑替换为阿里云 OSS、S3 或其他分布式对象存储，
         * 并通过 CDN 分发文件。
         */
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos');
        await mkdir(uploadDir, { recursive: true });

        // 保存文件
        const filePath = join(uploadDir, fileName);
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // 生成可访问的 URL
        const logoUrl = `/uploads/logos/${fileName}`;

        // 更新数据库
        await db.update(tenants)
            .set({
                logoUrl,
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, session.user.tenantId));

        // 记录审计日志
        await AuditService.log(db, {
            tableName: 'tenants',
            recordId: tenantId,
            action: 'UPDATE_INFO',
            userId: session.user.id,
            newValues: { logoUrl },
        });

        revalidatePath('/settings/general');
        return { success: true, logoUrl };
    } catch (error) {
        logger.error('上传 Logo 失败:', error);
        return { success: false, error: '上传失败，请稍后重试' };
    }
}

// ============ 企业认证相关 Actions ============

/**
 * 获取当前租户认证状态
 */
export async function getVerificationStatus(): Promise<{
    success: true;
    data: VerificationInfo;
} | { success: false; error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未登录或无租户信息' };
        }

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, session.user.tenantId),
            columns: {
                verificationStatus: true,
                businessLicenseUrl: true,
                legalRepName: true,
                registeredCapital: true,
                businessScope: true,
                verifiedAt: true,
                verificationRejectReason: true,
            },
        });

        if (!tenant) {
            return { success: false, error: '租户不存在' };
        }

        return {
            success: true,
            data: {
                status: (tenant.verificationStatus || 'unverified') as VerificationStatus,
                businessLicenseUrl: tenant.businessLicenseUrl,
                legalRepName: tenant.legalRepName,
                registeredCapital: tenant.registeredCapital,
                businessScope: tenant.businessScope,
                verifiedAt: tenant.verifiedAt,
                verificationRejectReason: tenant.verificationRejectReason,
            },
        };
    } catch {
        logger.error('获取认证状态失败:');
        return { success: false, error: '获取认证状态失败' };
    }
}

/** 提交认证申请的输入 */
const submitVerificationSchema = z.object({
    legalRepName: z.string().min(1, '法定代表人不能为空').max(50),
    registeredCapital: z.string().max(50).optional().default(''),
    businessScope: z.string().max(500).optional().default(''),
    businessLicenseUrl: z.string().min(1, '请上传营业执照'),
});

/**
 * 提交企业认证申请
 */
export async function submitVerification(data: {
    legalRepName: string;
    registeredCapital?: string;
    businessScope?: string;
    businessLicenseUrl: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未登录' };
        }

        // 权限校验
        try {
            await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
        } catch (_e) {
            return { success: false, error: '无权限执行此操作' };
        }

        // 输入校验
        const validated = submitVerificationSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0]?.message || '输入校验失败' };
        }

        const tenantId = session.user.tenantId;

        // 使用事务确保更新一致性 (R3-08)
        await db.transaction(async (tx) => {
            // 再次检查状态（事务内）
            const tenant = await tx.select({ verificationStatus: tenants.verificationStatus })
                .from(tenants)
                .where(eq(tenants.id, tenantId))
                .for('update')
                .then(res => res[0]);

            if (tenant?.verificationStatus === 'verified') {
                throw new Error('企业已完成认证，无需重复提交');
            }

            // 更新数据库
            await tx.update(tenants)
                .set({
                    verificationStatus: 'pending',
                    legalRepName: validated.data.legalRepName,
                    registeredCapital: validated.data.registeredCapital || null,
                    businessScope: validated.data.businessScope || null,
                    businessLicenseUrl: validated.data.businessLicenseUrl,
                    verificationRejectReason: null, // 清除之前的拒绝原因
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, tenantId));

            // 记录审计日志
            await AuditService.log(db, {
                tableName: 'tenants',
                recordId: tenantId,
                action: 'UPDATE_LOGISTIC_CONFIG', // Assuming this is the correct action for verification submission
                userId: session.user.id,
                newValues: data,
            });
        });

        revalidatePath('/settings/verification');
        return { success: true };
    } catch (error) {
        logger.error('提交认证申请失败:', error);
        return { success: false, error: error instanceof Error ? error.message : '提交失败，请稍后重试' };
    }
}

/**
 * 上传营业执照
 */
export async function uploadBusinessLicense(formData: FormData): Promise<{
    success: true;
    licenseUrl: string;
} | { success: false; error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未登录' };
        }

        // 权限校验
        try {
            await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
        } catch (_e) {
            return { success: false, error: '无权限执行此操作' };
        }

        const file = formData.get('license') as File | null;
        if (!file) {
            return { success: false, error: '请选择图片文件' };
        }

        // 验证文件大小 (R3-01)
        const MAX_LICENSE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_LICENSE_SIZE) {
            return { success: false, error: '文件不能超过 5MB' };
        }

        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: '仅支持 JPG、PNG、WebP、PDF 格式' };
        }

        // 安全获取扩展名
        const typeMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'application/pdf': 'pdf',
        };
        const ext = typeMap[file.type] || 'png';
        const fileName = `license_${session.user.tenantId}_${Date.now()}.${ext}`;

        // 确保目录存在
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'licenses');
        await mkdir(uploadDir, { recursive: true });

        // 保存文件
        const filePath = join(uploadDir, fileName);
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // 生成可访问的 URL
        const licenseUrl = `/uploads/licenses/${fileName}`;

        return { success: true, licenseUrl };
    } catch (error) {
        logger.error('上传营业执照失败:', error);
        return { success: false, error: '上传失败，请稍后重试' };
    }
}
