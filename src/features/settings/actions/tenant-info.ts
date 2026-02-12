'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '@/shared/lib/logger';

/**
 * 租户基本信息管理 Server Actions
 * 提供查询、更新租户信息和上传 Logo 的功能
 */

// ============ 类型定义 ============

/** 租户联系信息 */
export interface TenantContactInfo {
  address: string;
  phone: string;
  email: string;
}

/** 租户完整信息（用于前端显示） */
export interface TenantInfo {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  contact: TenantContactInfo;
}

/** 允许编辑租户信息的角色 */
const EDITABLE_ROLES = ['BOSS', 'ADMIN'];

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
export async function getTenantInfo(): Promise<
  { success: true; data: TenantInfo } | { success: false; error: string }
> {
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
  } catch (error) {
    logger.error('获取租户信息失败:', error);
    return { success: false, error: '获取租户信息失败' };
  }
}

/**
 * 检查当前用户是否有编辑权限
 */
export async function canEditTenantInfo(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.role) return false;
  return EDITABLE_ROLES.includes(session.user.role);
}

/**
 * 更新租户基本信息
 * 仅 BOSS 和 ADMIN 角色可调用
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
    if (!session.user.role || !EDITABLE_ROLES.includes(session.user.role)) {
      return { success: false, error: '无权限执行此操作' };
    }

    // 输入校验
    const validated = updateTenantInfoSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || '输入校验失败' };
    }

    // 获取当前 settings
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId),
      columns: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    // 更新数据库
    await db
      .update(tenants)
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
      .where(eq(tenants.id, session.user.tenantId));

    revalidatePath('/settings/general');
    return { success: true };
  } catch (error) {
    logger.error('更新租户信息失败:', error);
    return { success: false, error: '更新失败，请稍后重试' };
  }
}

/**
 * 上传租户 Logo
 * 接收 FormData，保存到 public/uploads/logos/ 目录
 */
export async function uploadTenantLogo(
  formData: FormData
): Promise<{ success: true; logoUrl: string } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    // 权限校验
    if (!session.user.role || !EDITABLE_ROLES.includes(session.user.role)) {
      return { success: false, error: '无权限执行此操作' };
    }

    const file = formData.get('logo') as File | null;
    if (!file) {
      return { success: false, error: '请选择图片文件' };
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: '仅支持 JPG、PNG、GIF、WebP 格式' };
    }

    // 验证文件大小（最大 2MB）
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: '图片大小不能超过 2MB' };
    }

    // 生成文件名
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${session.user.tenantId}_${Date.now()}.${ext}`;

    // 确保目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos');
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // 生成可访问的 URL
    const logoUrl = `/uploads/logos/${fileName}`;

    // 更新数据库
    await db
      .update(tenants)
      .set({
        logoUrl,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, session.user.tenantId));

    revalidatePath('/settings/general');
    return { success: true, logoUrl };
  } catch (error) {
    logger.error('上传 Logo 失败:', error);
    return { success: false, error: '上传失败，请稍后重试' };
  }
}

// ============ 企业认证相关 Actions ============

/** 认证状态类型 */
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

/** 认证信息 */
export interface VerificationInfo {
  status: VerificationStatus;
  businessLicenseUrl: string | null;
  legalRepName: string | null;
  registeredCapital: string | null;
  businessScope: string | null;
  verifiedAt: Date | null;
  verificationRejectReason: string | null;
}

/**
 * 获取当前租户认证状态
 */
export async function getVerificationStatus(): Promise<
  | {
      success: true;
      data: VerificationInfo;
    }
  | { success: false; error: string }
> {
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
  } catch (error) {
    logger.error('获取认证状态失败:', error);
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
 * 仅 BOSS 和 ADMIN 角色可调用
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
    if (!session.user.role || !EDITABLE_ROLES.includes(session.user.role)) {
      return { success: false, error: '无权限执行此操作' };
    }

    // 输入校验
    const validated = submitVerificationSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || '输入校验失败' };
    }

    // 检查当前状态
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId),
      columns: { verificationStatus: true },
    });

    // 已认证的不能重复申请
    if (tenant?.verificationStatus === 'verified') {
      return { success: false, error: '企业已完成认证' };
    }

    // 更新数据库
    await db
      .update(tenants)
      .set({
        verificationStatus: 'pending',
        legalRepName: validated.data.legalRepName,
        registeredCapital: validated.data.registeredCapital || null,
        businessScope: validated.data.businessScope || null,
        businessLicenseUrl: validated.data.businessLicenseUrl,
        verificationRejectReason: null, // 清除之前的拒绝原因
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, session.user.tenantId));

    revalidatePath('/settings/verification');
    return { success: true };
  } catch (error) {
    logger.error('提交认证申请失败:', error);
    return { success: false, error: '提交失败，请稍后重试' };
  }
}

/**
 * 上传营业执照
 * 接收 FormData，保存到 public/uploads/licenses/ 目录
 */
export async function uploadBusinessLicense(formData: FormData): Promise<
  | {
      success: true;
      licenseUrl: string;
    }
  | { success: false; error: string }
> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    // 权限校验
    if (!session.user.role || !EDITABLE_ROLES.includes(session.user.role)) {
      return { success: false, error: '无权限执行此操作' };
    }

    const file = formData.get('license') as File | null;
    if (!file) {
      return { success: false, error: '请选择图片文件' };
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: '仅支持 JPG、PNG、WebP、PDF 格式' };
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: '文件大小不能超过 5MB' };
    }

    // 生成文件名
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
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
