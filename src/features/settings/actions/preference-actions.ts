'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 用户偏好设置类型
 */
export interface UserPreferences {
    quoteMode?: 'PRODUCT_FIRST' | 'SPACE_FIRST';
}

/**
 * 获取当前用户的偏好设置
 */
export async function getUserPreferences(): Promise<UserPreferences> {
    const session = await auth();
    if (!session?.user?.id) {
        return { quoteMode: 'PRODUCT_FIRST' };
    }

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { preferences: true },
        });

        const prefs = (user?.preferences ?? {}) as UserPreferences;
        return {
            quoteMode: prefs.quoteMode ?? 'PRODUCT_FIRST',
        };
    } catch (error) {
        console.error('获取用户偏好失败:', error);
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

        try {
            const user = await db.query.users.findFirst({
                where: eq(users.id, session.user.id),
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
                .where(eq(users.id, session.user.id));

            // 记录审计日志
            // 记录审计日志
            await AuditService.log(db, {
                tableName: 'users',
                recordId: session.user.id,
                action: 'UPDATE',
                userId: session.user.id,
                tenantId: session.user.tenantId,
                oldValues: { preferences: existingPrefs },
                newValues: { preferences: newPrefs },
                changedFields: data,
            });

            revalidatePath('/settings/preferences');
            return { success: true, message: '偏好设置已更新' };
        } catch (error) {
            console.error('更新用户偏好失败:', error);
            return { success: false, error: '更新偏好设置失败，请稍后重试' };
        }
    }
);

export async function updateUserPreferences(params: z.infer<typeof updatePreferencesSchema>) {
    return updateUserPreferencesActionInternal(params);
}
