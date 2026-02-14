/**
 * 邀请相关的 Server Actions
 *
 * 提供员工邀请和客户邀请的接口
 */
'use server';

import { auth } from '@/shared/lib/auth';
import {
  generateEmployeeInviteLink,
  generateCustomerInviteLink,
  registerEmployeeByInvite,
  registerCustomerByInvite,
  verifyInviteToken,
} from '@/shared/lib/invite-token';
import { revalidatePath } from 'next/cache';

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

  // 检查权限（只有管理员可以邀请员工）
  const allowedRoles = ['ADMIN', 'OWNER', 'TENANT_ADMIN'];
  if (
    !allowedRoles.includes(session.user.role) &&
    !session.user.roles?.some((r) => allowedRoles.includes(r))
  ) {
    return { success: false, error: '无权限邀请员工' };
  }

  try {
    const link = await generateEmployeeInviteLink(
      session.user.tenantId,
      session.user.id,
      defaultRoles
    );
    return { success: true, link };
  } catch (error) {
    console.error('生成员工邀请链接失败:', error);
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
    console.error('生成客户邀请链接失败:', error);
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
  const result = await registerEmployeeByInvite(token, userData);
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
  const result = await registerCustomerByInvite(token, userData);
  if (result.success) {
    revalidatePath('/customers');
  }
  return result;
}
