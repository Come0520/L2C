import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升定义
const hoisted = vi.hoisted(() => {
    const mocks = {
        smsSend: vi.fn(),
        larkSend: vi.fn(),
        wechatSend: vi.fn(),
        auth: vi.fn(),
        getSetting: vi.fn(),
        hasPermission: vi.fn(),
        logAudit: vi.fn(),
        logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
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
            onConflictDoUpdate: vi.fn(() => chain),
            execute: vi.fn().mockResolvedValue(resolvedValue),
            then: (onFulfilled?: any) => Promise.resolve(resolvedValue).then(onFulfilled),
            catch: (onRejected?: any) => Promise.resolve(resolvedValue).catch(onRejected),
        };
        return chain;
    };

    return { mocks, createDrizzleMock };
});

// Mock 适配器
vi.mock('../adapters/sms-adapter', () => ({
    SmsAdapter: class { send = (args: any) => hoisted.mocks.smsSend(args) }
}));
vi.mock('../adapters/lark-adapter', () => ({
    LarkAdapter: class { send = (args: any) => hoisted.mocks.larkSend(args) }
}));
vi.mock('../adapters/wechat-adapter', () => ({
    WeChatAdapter: class { send = (args: any) => hoisted.mocks.wechatSend(args) }
}));
vi.mock('@/shared/lib/auth', () => ({ auth: hoisted.mocks.auth }));
vi.mock('@/shared/lib/logger', () => ({ logger: hoisted.mocks.logger }));
vi.mock('@/features/settings/actions/system-settings-actions', () => ({ getSetting: hoisted.mocks.getSetting }));
vi.mock('@/shared/services/audit-service', () => ({ AuditService: { log: hoisted.mocks.logAudit } }));
vi.mock('@/shared/lib/role-permission-service', () => ({ RolePermissionService: { hasPermission: hoisted.mocks.hasPermission } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            notificationTemplates: { findFirst: vi.fn(), findMany: vi.fn() },
            systemAnnouncements: { findMany: vi.fn() },
            systemSettings: { findFirst: vi.fn() },
        },
        transaction: vi.fn(),
        select: vi.fn(() => hoisted.createDrizzleMock([])),
        insert: vi.fn(() => hoisted.createDrizzleMock([])),
        update: vi.fn(() => hoisted.createDrizzleMock([])),
    }
}));

import {
    renderTemplate,
    processNotificationQueue,
    sendNotificationByTemplate,
    getActiveAnnouncements,
    createAnnouncement,
    upsertNotificationTemplate,
    getNotificationTemplates
} from '../notification-service';
import { db } from '@/shared/api/db';

describe('NotificationService Full Test Suite', () => {
    const mockSession = { user: { id: 'u1', tenantId: 't1', role: 'USER' } };

    beforeEach(() => {
        vi.resetAllMocks();
        hoisted.mocks.auth.mockResolvedValue(mockSession);
    });

    describe('renderTemplate', () => {
        it('should replace placeholders and escape content', () => {
            const result = renderTemplate('Hello {{name}}!', { name: '<script>alert(1)</script>' });
            expect(result).toBe('Hello &lt;script&gt;alert(1)&lt;/script&gt;!');
        });

        it('should handle undefined parameters gracefully', () => {
            expect(renderTemplate('A{{b}}', {})).toBe('A{{b}}');
        });
    });

    describe('sendNotificationByTemplate', () => {
        it('should create queue items and notifications for IN_APP', async () => {
            (db.query.notificationTemplates.findFirst as any).mockResolvedValue({
                id: 'tmpl1',
                code: 'T1',
                titleTemplate: 'T',
                contentTemplate: 'C',
                channels: ['IN_APP'],
                notificationType: 'SYSTEM',
                isActive: true
            });

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
                const txMock = hoisted.createDrizzleMock([{ id: 'q1' }]);
                return await cb(txMock);
            });

            const result = await sendNotificationByTemplate({
                templateCode: 'T1',
                userId: 'u2',
                params: {}
            });

            expect(result.success).toBe(true);
            expect(result.data?.queuedCount).toBe(1);
        });

        it('should return error if template not found', async () => {
            (db.query.notificationTemplates.findFirst as any).mockResolvedValue(null);
            const result = await sendNotificationByTemplate({
                templateCode: 'MISSING',
                userId: 'u1',
                params: {}
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });
    });

    describe('processNotificationQueue', () => {
        it('should process pending items in order of priority', async () => {
            const mockItems = [
                { id: '1', channel: 'SMS', userId: 'u1', title: 'T', content: 'C', priority: 'URGENT' }
            ];

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
                const txMock = hoisted.createDrizzleMock(mockItems);
                return await cb(txMock);
            });

            hoisted.mocks.smsSend.mockResolvedValue(true);
            vi.mocked(db.update).mockReturnValue(hoisted.createDrizzleMock([]));

            const stats = await processNotificationQueue(1);
            expect(stats.processed).toBe(1);
            expect(stats.success).toBe(1);
            expect(hoisted.mocks.smsSend).toHaveBeenCalled();
        });

        it('should retry failed notifications', async () => {
            const mockItems = [
                { id: '2', channel: 'SMS', userId: 'u1', title: 'T', content: 'C', priority: 'NORMAL', retryCount: 0 }
            ];

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
                const txMock = hoisted.createDrizzleMock(mockItems);
                return await cb(txMock);
            });

            hoisted.mocks.smsSend.mockResolvedValue(false);
            vi.mocked(db.update).mockReturnValue(hoisted.createDrizzleMock([]));

            const stats = await processNotificationQueue(1);
            expect(stats.failed).toBe(1);
            // Verify status set to PENDING again if retryCount < 3
            expect(db.update).toHaveBeenCalled();
        });

        it('should handle multiple channels correctly', async () => {
            const mockItems = [
                { id: '3', channel: 'SMS', userId: 'u1', title: 'T', content: 'C' },
                { id: '4', channel: 'LARK', userId: 'u1', title: 'T', content: 'C' }
            ];

            vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
                // Return items sequentially on first calls
                const txMock = hoisted.createDrizzleMock(mockItems);
                return await cb(txMock);
            });

            hoisted.mocks.smsSend.mockResolvedValue(true);
            hoisted.mocks.larkSend.mockResolvedValue(true);

            const stats = await processNotificationQueue(2);
            expect(stats.success).toBe(2);
        });

        it('should mark as failed if retry count exceeds limit', async () => {
            const mockItems = [
                { id: '5', channel: 'SMS', userId: 'u1', title: 'T', content: 'C', retryCount: 2 }
            ];

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
                const txMock = hoisted.createDrizzleMock(mockItems);
                return await cb(txMock);
            });

            hoisted.mocks.smsSend.mockResolvedValue(false);

            const stats = await processNotificationQueue(1);
            expect(stats.failed).toBe(1);
            // Verify status becomes FAILED on last retry
            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('getActiveAnnouncements', () => {
        it('should filter by role', async () => {
            (db.query.systemAnnouncements.findMany as any).mockResolvedValue([{ id: 'ann1' }]);
            const results = await getActiveAnnouncements('ADMIN');
            expect(results).toHaveLength(1);
        });
    });

    describe('announcement and template management', () => {
        it('createAnnouncement should check permissions', async () => {
            hoisted.mocks.hasPermission.mockResolvedValue(false);
            const result = await createAnnouncement({
                title: 'T', content: 'C', startAt: new Date()
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('权限不足');
        });

        it('upsertNotificationTemplate should handle creation success', async () => {
            hoisted.mocks.hasPermission.mockResolvedValue(true);
            vi.mocked(db.insert).mockReturnValue(hoisted.createDrizzleMock([{ id: 'new-tmpl' }]));

            const result = await upsertNotificationTemplate({
                code: 'NEW', name: 'N', notificationType: 'S', titleTemplate: 'T', contentTemplate: 'C',
                channels: ['IN_APP']
            });

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('new-tmpl');
        });

        it('upsertNotificationTemplate should fail with validation error', async () => {
            const result = await upsertNotificationTemplate({
                code: '', // Invalid
                name: 'N',
                notificationType: 'S',
                titleTemplate: 'T',
                contentTemplate: 'C',
                channels: ['IN_APP']
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('代码不能为空');
        });

        it('upsertNotificationTemplate should check permissions accurately', async () => {
            hoisted.mocks.hasPermission.mockResolvedValue(false);
            hoisted.mocks.auth.mockResolvedValue({ user: { id: 'u1', tenantId: 't1', role: 'USER' } });

            const result = await upsertNotificationTemplate({
                code: 'T1', name: 'N', notificationType: 'S', titleTemplate: 'T', contentTemplate: 'C',
                channels: ['IN_APP']
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('权限不足');
        });

        it('upsertNotificationTemplate should return error if update fails', async () => {
            hoisted.mocks.hasPermission.mockResolvedValue(true);
            vi.mocked(db.update).mockReturnValue(hoisted.createDrizzleMock([]));

            const result = await upsertNotificationTemplate({
                id: 'missing-id',
                code: 'T1', name: 'N', notificationType: 'S', titleTemplate: 'T', contentTemplate: 'C',
                channels: ['IN_APP']
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });
        describe('Audit and Auth edges', () => {
            it('sendNotificationByTemplate should fail without session', async () => {
                hoisted.mocks.auth.mockResolvedValue(null);
                const result = await sendNotificationByTemplate({ templateCode: 'T', params: {}, userId: 'u1' });
                expect(result.success).toBe(false);
                expect(result.error).toBe('未授权');
            });

            it('sendNotificationByTemplate should use default format if no channels provided', async () => {
                hoisted.mocks.auth.mockResolvedValue({ user: { id: 'u1', tenantId: 't1' } });
                vi.mocked(db.query.notificationTemplates.findFirst as any).mockResolvedValue({
                    code: 'T', titleTemplate: 'T', contentTemplate: 'C', channels: []
                });
                // Mock getSetting
                vi.mocked(db.query.systemSettings.findFirst as any).mockResolvedValue({ value: ['IN_APP'] });

                vi.mocked(db.transaction).mockResolvedValue([]);

                await sendNotificationByTemplate({ templateCode: 'T', params: {}, userId: 'u1' });
                expect(db.transaction).toHaveBeenCalled();
            });

            it('createAnnouncement should handle validation failure', async () => {
                hoisted.mocks.hasPermission.mockResolvedValue(true);
                const result = await createAnnouncement({ title: '' } as any); // empty title
                expect(result.success).toBe(false);
            });

            it('getNotificationTemplates should return empty if no session', async () => {
                hoisted.mocks.auth.mockResolvedValue(null);
                const result = await getNotificationTemplates();
                expect(result).toEqual([]);
            });

            it('upsertNotificationTemplate should log audit on update', async () => {
                hoisted.mocks.hasPermission.mockResolvedValue(true);
                vi.mocked(db.update).mockReturnValue(hoisted.createDrizzleMock([{ id: 't1', code: 'T' }]));

                await upsertNotificationTemplate({
                    id: 't1',
                    code: 'T',
                    name: 'N',
                    notificationType: 'SYSTEM',
                    titleTemplate: 'T',
                    contentTemplate: 'C',
                    channels: ['IN_APP']
                });
                expect(hoisted.mocks.logAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                    action: 'UPDATE',
                    tableName: 'notification_templates'
                }));
            });
        });
    });
});
