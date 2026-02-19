import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升定义
const hoisted = vi.hoisted(() => {
    const mocks = {
        auth: vi.fn(),
        slacheck: vi.fn(),
    };

    const createDrizzleMock = (resolvedValue: any = []) => {
        const chain: any = {
            select: vi.fn(() => chain),
            from: vi.fn(() => chain),
            where: vi.fn(() => chain),
            orderBy: vi.fn(() => chain),
            limit: vi.fn(() => chain),
            offset: vi.fn(() => chain),
            for: vi.fn(() => chain),
            update: vi.fn(() => chain),
            set: vi.fn(() => chain),
            insert: vi.fn(() => chain),
            values: vi.fn(() => chain),
            returning: vi.fn(() => chain),
            onConflictDoUpdate: vi.fn(() => chain), // Batch update uses this
            execute: vi.fn().mockResolvedValue(resolvedValue),
            then: (onFulfilled?: any) => Promise.resolve(resolvedValue).then(onFulfilled),
            catch: (onRejected?: any) => Promise.resolve(resolvedValue).catch(onRejected),
        };
        return chain;
    };

    return { mocks, createDrizzleMock };
});

// Mock Auth
vi.mock('@/shared/lib/auth', () => ({ auth: hoisted.mocks.auth }));
vi.mock('@/features/notifications/sla-checker', () => ({
    slaChecker: { runAllChecks: hoisted.mocks.slacheck }
}));

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            notifications: { findMany: vi.fn() },
            notificationPreferences: { findFirst: vi.fn(), findMany: vi.fn() },
        },
        transaction: vi.fn(),
        select: vi.fn(() => hoisted.createDrizzleMock([{ count: 10 }])), // Default count mock
        insert: vi.fn(() => hoisted.createDrizzleMock([])),
        update: vi.fn(() => hoisted.createDrizzleMock([])),
    }
}));


// Mock Logger（createSafeAction 内部使用）
vi.mock('@/shared/lib/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    }
}));

import {
    getNotifications,
    markAsRead,
    updateNotificationPreference,
    batchUpdateNotificationPreferences,
    runSLACheck
} from '../actions';
import { db } from '@/shared/api/db';

describe('Notification Server Actions', () => {
    const mockTenantId = 't1';
    const mockUserId = 'u1';
    const mockSession = { user: { id: mockUserId, tenantId: mockTenantId, role: 'USER' } };

    beforeEach(() => {
        vi.resetAllMocks();
        hoisted.mocks.auth.mockResolvedValue(mockSession);
    });

    describe('getNotifications', () => {
        it('should fetch notifications with pagination', async () => {
            const mockData = [{ id: 'n1', title: 'Test' }];
            (db.query.notifications.findMany as any).mockResolvedValue(mockData);

            // Simulate count query response (already set in default mock but explicit here)
            vi.mocked(db.select).mockReturnValue(hoisted.createDrizzleMock([{ count: 100 }]));

            const result = await getNotifications({ page: 1, limit: 10, onlyUnread: false });

            expect(result.success).toBe(true);
            // createSafeAction 将 handler 返回值包裹在 result.data 中
            expect(result.data?.data).toEqual(mockData);
            expect(result.data?.meta?.total).toBe(100);
            expect(db.query.notifications.findMany).toHaveBeenCalled();
        });

        it('should return empty list on error', async () => {
            (db.query.notifications.findMany as any).mockRejectedValue(new Error('DB Error'));

            const result = await getNotifications({ page: 1, limit: 10, onlyUnread: false });

            expect(result.success).toBe(true);
            expect(result.data?.data).toEqual([]);
            expect(result.data?.meta?.total).toBe(0);
        });
    });

    describe('markAsRead', () => {
        it('should update specific notifications', async () => {
            const result = await markAsRead({ ids: ['n1', 'n2'] });

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
        });

        it('should do nothing if ids list is empty', async () => {
            const result = await markAsRead({ ids: [] });

            expect(result.success).toBe(true);
            expect(db.update).not.toHaveBeenCalled();
        });
    });

    describe('updateNotificationPreference', () => {
        it('should update existing preference', async () => {
            (db.query.notificationPreferences.findFirst as any).mockResolvedValue({ id: 'p1' });

            const result = await updateNotificationPreference({
                notificationType: 'SYSTEM',
                channels: ['SMS']
            });

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
            // Verify logic ensures IN_APP is added
            // Since we mocked update to return chain, checking args is complex with Drizzle mock chains
            // Ideally we'd capture the .set call arguments.
        });

        it('should create new preference if not exists', async () => {
            (db.query.notificationPreferences.findFirst as any).mockResolvedValue(null);

            const result = await updateNotificationPreference({
                notificationType: 'SYSTEM',
                channels: ['SMS']
            });

            expect(result.success).toBe(true);
            expect(db.insert).toHaveBeenCalled();
        });
    });

    describe('batchUpdateNotificationPreferences', () => {
        it('should process batch updates in transaction', async () => {
            // 必须提供所有 NOTIFICATION_TYPES 枚举值，因为 z.record(z.enum(...)) 校验严格
            const input = {
                preferences: {
                    'SYSTEM': ['SMS' as const],
                    'ORDER_STATUS': ['IN_APP' as const],
                    'APPROVAL': ['IN_APP' as const],
                    'ALERT': ['IN_APP' as const],
                    'MENTION': ['IN_APP' as const],
                    'INFO': ['IN_APP' as const],
                    'SUCCESS': ['IN_APP' as const],
                    'WARNING': ['IN_APP' as const],
                    'ERROR': ['IN_APP' as const],
                }
            };

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: unknown) => {
                const txMock = {
                    insert: vi.fn(() => hoisted.createDrizzleMock([])),
                };
                return await (cb as Function)(txMock);
            });

            const result = await batchUpdateNotificationPreferences(input);
            expect(result.success).toBe(true);
            expect(db.transaction).toHaveBeenCalled();
        });
    });

    describe('runSLACheck', () => {
        it('should deny non-admin access', async () => {
            const result = await runSLACheck();
            // Since user is 'USER', it should error
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should run checks for admin', async () => {
            hoisted.mocks.auth.mockResolvedValue({
                user: { id: 'admin1', tenantId: 't1', role: 'ADMIN' }
            });
            hoisted.mocks.slacheck.mockResolvedValue({ success: true });

            const result = await runSLACheck();

            expect(result.success).toBe(true);
            expect(hoisted.mocks.slacheck).toHaveBeenCalled();
        });
    });
});
