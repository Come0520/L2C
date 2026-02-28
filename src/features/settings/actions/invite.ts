'use server';

/**
 * 邀请相关的 Server Actions
 *
 * 提供员工邀请和客户邀请的接口
 */

import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import {
  generateEmployeeInviteLink,
  generateCustomerInviteLink,
  registerEmployeeByInvite,
  registerCustomerByInvite,
  verifyInviteToken,
} from '@/shared/lib/invite-token';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';

const registrationSchema = z.object({
  name: z.string().min(1, '姓名必填'),
  phone: z.string().min(1, '手机号必填'),
  email: z.string().email('邮箱格式错误').optional().or(z.literal('')),
  password: z.string().min(8, '密码至少8位'),
});

// ============================================================
// 员工邀请
// ============================================================

/**
 * 生成员工邀请链接（管理员操作）
 */
export async function createEmployeeInviteLink(defaultRoles?: string[]) {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
    return { success: false, error: '未授权' };
  }

  // 检查权限（只有管理员可以邀请所有员工，或者有特定权限的人只能邀请工人）
  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
  } catch {
    // 如果没有全局 MANAGE 权限，再检查是否有专有 INVITE_WORKER 的权限
    try {
      await checkPermission(session, PERMISSIONS.SETTINGS.INVITE_WORKER);
      // 检查 defaultRoles 是否严格只包含 WORKER
      if (!defaultRoles || defaultRoles.length === 0 || defaultRoles.some((r) => r !== 'WORKER')) {
        return { success: false, error: '无权限邀请该类型的员工，仅限邀请工人' };
      }
    } catch {
      return { success: false, error: '无权限邀请员工' };
    }
  }

  try {
    const link = await generateEmployeeInviteLink(
      session.user.tenantId,
      session.user.id,
      defaultRoles
    );
    return { success: true, link };
  } catch (error) {
    logger.error('生成员工邀请链接失败:', error);
    return { success: false, error: '生成邀请链接失败' };
  }
}

// ============================================================
// 客户邀请
// ============================================================

/**
 * 生成客户邀请链接（从客户详情页操作）
 */
export async function createCustomerInviteLink(customerId: string) {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
    return { success: false, error: '未授权' };
  }

  try {
    const link = await generateCustomerInviteLink(
      session.user.tenantId,
      session.user.id,
      customerId
    );
    return { success: true, link };
  } catch (error) {
    logger.error('生成客户邀请链接失败:', error);
    return { success: false, error: '生成邀请链接失败' };
  }
}

// ============================================================
// 注册处理
// ============================================================

/**
 * 验证邀请令牌
 */
export async function validateInviteToken(token: string) {
  try {
    const result = await verifyInviteToken(token);
    return result;
  } catch {
    return { valid: false, error: '令牌验证失败' };
  }
}

/**
 * 员工通过邀请链接注册
 */
export async function registerEmployee(
  token: string,
  userData: {
    name: string;
    phone: string;
    email?: string;
    password: string;
  }
) {
  const validated = registrationSchema.safeParse(userData);
  if (!validated.success) {
    return { success: false, error: '输入数据格式错误：' + validated.error.message };
  }

  const result = await registerEmployeeByInvite(token, validated.data);
  if (result.success) {
    revalidatePath('/settings/users');
  }
  return result;
}

/**
 * 客户通过邀请链接注册
 */
export async function registerCustomer(
  token: string,
  userData: {
    name: string;
    phone: string;
    email?: string;
    password: string;
  }
) {
  const validated = registrationSchema.safeParse(userData);
  if (!validated.success) {
    return { success: false, error: '输入数据格式错误：' + validated.error.message };
  }

  const result = await registerCustomerByInvite(token, validated.data);
  if (result.success) {
    revalidatePath('/customers');
  }
  return result;
}
