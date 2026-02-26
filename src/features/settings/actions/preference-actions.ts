'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';

/**
 * 用户偏好设置类型
 */
export interface UserPreferences {
  quoteMode?: 'PRODUCT_FIRST' | 'SPACE_FIRST';
}

/**
 * 缓存获取偏好设置的内部函数
 */
const getCachedUserPreferences = unstable_cache(
  async (userId: string): Promise<UserPreferences> => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { preferences: true },
    });

    const prefs = (user?.preferences ?? {}) as UserPreferences;
    return {
      quoteMode: prefs.quoteMode ?? 'PRODUCT_FIRST',
    };
  },
  ['user-preferences'],
  { tags: ['user-preferences'] }
);

/**
 * 获取当前用户的偏好设置
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const session = await auth();
  if (!session?.user?.id) {
    return { quoteMode: 'PRODUCT_FIRST' };
  }

  try {
    // 使用会话中的 userId 作为缓存键的一部分，但在 getCachedUserPreferences 中已经定义了参数
    // unstable_cache 会自动将参数加入缓存键
    return await getCachedUserPreferences(session.user.id);
  } catch (error) {
    logger.error('获取用户偏好失败:', error);
    return { quoteMode: 'PRODUCT_FIRST' };
  }
}

/**
 * 更新用户偏好设置
 */
const updatePreferencesSchema = z.object({
  quoteMode: z.enum(['PRODUCT_FIRST', 'SPACE_FIRST']).optional(),
});

const updateUserPreferencesActionInternal = createSafeAction(
  updatePreferencesSchema,
  async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.id) {
      return { success: false, error: '未授权' };
    }

    const userId = session.user.id;

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { preferences: true },
      });

      const existingPrefs = (user?.preferences ?? {}) as UserPreferences;

      const newPrefs: UserPreferences = {
        ...existingPrefs,
        ...data,
      };

      await db
        .update(users)
        .set({ preferences: newPrefs, updatedAt: new Date() })
        .where(eq(users.id, userId));

      // 记录审计日志
      await AuditService.log(db, {
        tableName: 'users',
        recordId: userId,
        action: 'UPDATE',
        userId: userId,
        tenantId: session.user.tenantId,
        oldValues: { preferences: existingPrefs },
        newValues: { preferences: newPrefs },
        changedFields: data,
      });

      // 清除偏好设置缓存
      revalidateTag('user-preferences', {});
      revalidatePath('/settings/preferences');

      return { success: true, message: '偏好设置已更新' };
    } catch (error) {
      logger.error('更新用户偏好失败:', error);
      return { success: false, error: '更新偏好设置失败，请稍后重试' };
    }
  }
);

export async function updateUserPreferences(params: z.infer<typeof updatePreferencesSchema>) {
  return updateUserPreferencesActionInternal(params);
}
