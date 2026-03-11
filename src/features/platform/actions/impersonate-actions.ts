'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

/**
 * 进入租户视角
 * 设置超管在 users 表中的 lastActiveTenantId 为指定租户 ID
 */
export async function enterTenantView(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.isPlatformAdmin) {
    throw new Error('权限不足: 仅超管可使用该功能');
  }

  await db.update(users).set({ lastActiveTenantId: tenantId }).where(eq(users.id, session.user.id));

  return { success: true };
}

/**
 * 退出租户视角
 * 重置超管的 lastActiveTenantId，恢复平台管理全量视角
 */
export async function exitTenantView() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.isPlatformAdmin) {
    throw new Error('权限不足: 仅超管可使用该功能');
  }

  await db
    .update(users)
    .set({ lastActiveTenantId: '__PLATFORM__' })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
