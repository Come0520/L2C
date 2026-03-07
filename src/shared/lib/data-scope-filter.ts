'use server';

/**
 * 数据范围过滤器 (Data Scope Filter)
 * 基础版套餐数据隔离：SALES 角色用户只能查看自己负责的数据
 * ADMIN / BOSS / 拥有 view:all_data 权限的用户不受此限制
 */

import { auth } from '@/shared/lib/auth';
import { eq, SQL } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm';

/**
 * 根据当前登录用户的角色和权限，构建数据范围过滤条件
 *
 * @param assigneeColumn - 需要过滤的「负责人 ID」列（如 leads.assignedSalesId）
 * @returns 若需要限制数据范围，返回 SQL 条件；否则返回 undefined（无需过滤）
 */
export async function buildDataScopeFilter(assigneeColumn: AnyColumn): Promise<SQL | undefined> {
  const session = await auth();
  if (!session?.user) return undefined;

  const {
    role,
    roles,
    id: userId,
  } = session.user as unknown as {
    role?: string;
    roles?: string[];
    id: string;
    [key: string]: unknown;
  };

  // 判断是否有全量数据访问权限
  const allRoles = Array.from(
    new Set([...(role ? [role] : []), ...(Array.isArray(roles) ? roles : [])])
  );

  const isUnrestricted = allRoles.some((r) =>
    ['ADMIN', 'BOSS', 'MANAGER', 'SUPER_ADMIN'].includes(r)
  );

  // 有全量权限 → 不加过滤
  if (isUnrestricted) return undefined;

  // SALES 或其他限制角色 → 只查看自己负责的数据
  return eq(assigneeColumn, userId);
}
