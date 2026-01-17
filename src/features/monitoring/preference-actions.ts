'use server';

import { db } from '@/shared/api/db';
import { notificationPreferences } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { NotificationType } from '@/shared/api/schema';

// Schema Definition
const updatePreferenceSchema = z.object({
    notificationType: z.enum(['SYSTEM', 'ORDER_STATUS', 'APPROVAL', 'ALERT', 'MENTION']),
    channels: z.array(z.string()), // ['IN_APP', 'SMS', 'EMAIL', etc.]
});

/**
 * 获取当前用户的所有通知偏好
 */
export async function getNotificationPreferences(userId: string) {
    const prefs = await db.query.notificationPreferences.findMany({
        where: eq(notificationPreferences.userId, userId)
    });
    return { success: true, data: prefs };
}

/**
 * 更新单项通知偏好
 */
export const updateNotificationPreference = createSafeAction(updatePreferenceSchema, async (data, { session }) => {
    // Users can always manage their own preferences

    // Check if preference exists
    const existing = await db.query.notificationPreferences.findFirst({
        where: and(
            eq(notificationPreferences.userId, session.user.id),
            eq(notificationPreferences.notificationType, data.notificationType as any)
        )
    });

    if (existing) {
        await db.update(notificationPreferences)
            .set({
                channels: data.channels,
                updatedAt: new Date()
            })
            .where(eq(notificationPreferences.id, existing.id));
    } else {
        await db.insert(notificationPreferences).values({
            tenantId: session.user.tenantId!,
            userId: session.user.id,
            notificationType: data.notificationType as any,
            channels: data.channels,
        });
    }

    return { success: true };
});
