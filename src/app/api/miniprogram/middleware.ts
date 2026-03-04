/**
 * 小程序端角色权限中间件
 *
 * @description 与移动端 `mobile-auth.ts` 设计完全对齐，
 * 提供按角色过滤 API 访问权限的便捷函数。
 * 适配小程序 Token 的 Payload 结构。
 */
import { NextRequest } from 'next/server';
import { getMiniprogramUser, AuthUser } from './auth-utils';
import { apiError, apiForbidden, apiUnauthorized } from '@/shared/lib/api-response';

/** 小程序角色枚举（与前端 auth.ts 的 UserRole 语义对齐） */
type MiniprogramRole = 'manager' | 'admin' | 'sales' | 'worker' | 'customer';

/** 认证结果类型 */
type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; response: ReturnType<typeof apiError> };

/**
 * 统一认证 + 角色检查
 *
 * @param request - Next.js 请求对象
 * @param allowedRoles - 允许访问的角色列表
 * @returns 认证结果
 *
 * @example
 * ```typescript
 * const auth = await requireMiniprogramRole(request, ['sales', 'manager']);
 * if (!auth.success) return auth.response;
 * const { user } = auth; // 类型安全的 AuthUser
 * ```
 */
export async function requireMiniprogramRole(
  request: NextRequest,
  allowedRoles: MiniprogramRole[]
): Promise<AuthResult> {
  const user = await getMiniprogramUser(request);
  if (!user) {
    return { success: false, response: apiUnauthorized('未授权') };
  }

  const userRole = (user.role || '').toLowerCase() as MiniprogramRole;
  if (!allowedRoles.includes(userRole)) {
    return {
      success: false,
      response: apiForbidden(`仅限 ${allowedRoles.join('/')} 角色使用`),
    };
  }

  return { success: true, user };
}

// ============================================================
// 便捷方法（与移动端 mobile-auth.ts 的 requireXxx 命名对齐）
// ============================================================

/** 销售端权限：销售、店长、管理员可访问 */
export const requireSales = (req: NextRequest) =>
  requireMiniprogramRole(req, ['sales', 'manager', 'admin']);

/** 工人端权限：仅工人角色 */
export const requireWorker = (req: NextRequest) => requireMiniprogramRole(req, ['worker']);

/** 客户端权限：仅客户角色 */
export const requireCustomer = (req: NextRequest) => requireMiniprogramRole(req, ['customer']);

/** 管理端权限：店长、管理员 */
export const requireManager = (req: NextRequest) =>
  requireMiniprogramRole(req, ['manager', 'admin']);

/** 内部员工：销售 + 工人 + 管理员 */
export const requireInternal = (req: NextRequest) =>
  requireMiniprogramRole(req, ['sales', 'worker', 'manager', 'admin']);
