'use server';

import { unstable_cache } from 'next/cache';
import { db } from '@/shared/api/db';
import {
    notificationTemplates,
    systemAnnouncements
} from '@/shared/api/schema/notifications';
import { eq, and, sql, gte, lte, isNull, or, desc } from 'drizzle-orm';

/**
 * 缓存的活跃公告查询 (内部实现)
 * 分离出独立函数以便在测试中被 mock 或绕过缓存机制
 */
export const getCachedAnnouncements = unstable_cache(
    async (tenantId: string, userRole?: string) => {
        const now = new Date();
        return await db.query.systemAnnouncements.findMany({
            where: and(
                or(
                    eq(systemAnnouncements.tenantId, tenantId),
                    isNull(systemAnnouncements.tenantId)
                ),
                lte(systemAnnouncements.startAt, now),
                or(
                    isNull(systemAnnouncements.endAt),
                    gte(systemAnnouncements.endAt, now)
                ),
                or(
                    isNull(systemAnnouncements.targetRoles),
                    userRole ? sql`${systemAnnouncements.targetRoles} @> ${sql.param(JSON.stringify([userRole]))}::jsonb` : undefined
                )
            ),
            orderBy: [
                desc(systemAnnouncements.isPinned),
                desc(systemAnnouncements.createdAt)
            ],
            limit: 10,
        });
    },
    ['active-announcements'],
    { revalidate: 60, tags: ['announcements'] }
);

/**
 * 缓存的通知模板查询 (内部实现)
 */
export const getCachedTemplates = unstable_cache(
    async (tenantId: string) => {
        return await db.query.notificationTemplates.findMany({
            where: or(
                eq(notificationTemplates.tenantId, tenantId),
                isNull(notificationTemplates.tenantId)
            ),
            orderBy: [notificationTemplates.notificationType, notificationTemplates.code],
        });
    },
    ['notification-templates'],
    { revalidate: 300, tags: ['notification-templates'] }
);
