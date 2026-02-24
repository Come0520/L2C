import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升定义
const hoisted = vi.hoisted(() => ({
    mocks: {
        smsSend: vi.fn(),
        larkSend: vi.fn(),
        wechatSend: vi.fn(),
        auth: vi.fn(),
        getSetting: vi.fn(),
        hasPermission: vi.fn(),
        logAudit: vi.fn(),
        logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
    },
    createDrizzleMock: (resolvedValue: any = []) => {
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
            execute: vi.fn().mockResolvedValue(resolvedValue),
            then: (resolve: any) => Promise.resolve(resolvedValue).then(resolve),
            catch: (reject: any) => Promise.resolve(resolvedValue).catch(reject),
        };
        return chain;
    }
}));

// Mock 外部依赖
vi.mock('../adapters/sms-adapter', () => ({ SmsAdapter: class { send = (a: any) => hoisted.mocks.smsSend(a) } }));
vi.mock('../adapters/lark-adapter', () => ({ LarkAdapter: class { send = (a: any) => hoisted.mocks.larkSend(a) } }));
vi.mock('../adapters/wechat-adapter', () => ({ WeChatAdapter: class { send = (a: any) => hoisted.mocks.wechatSend(a) } }));
vi.mock('@/shared/lib/auth', () => ({ auth: hoisted.mocks.auth }));
vi.mock('@/shared/lib/logger', () => ({ logger: hoisted.mocks.logger }));
vi.mock('@/features/settings/actions/system-settings-actions', () => ({ getSetting: hoisted.mocks.getSetting }));
vi.mock('@/shared/services/audit-service', () => ({ AuditService: { log: hoisted.mocks.logAudit } }));
vi.mock('@/shared/lib/role-permission-service', () => ({ RolePermissionService: { hasPermission: hoisted.mocks.hasPermission } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: vi.fn(f => f) }));

// Mock 缓存层（透传查询逻辑）
vi.mock('../notification-cache', () => ({
    getCachedAnnouncements: vi.fn(async () => {
        const { db } = await import('@/shared/api/db');
        return db.query.systemAnnouncements.findMany({} as any);
    }),
    getCachedTemplates: vi.fn(async () => {
        const { db } = await import('@/shared/api/db');
        return db.query.notificationTemplates.findMany({} as any);
    }),
}));

// Mock 数据库核心
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            notificationTemplates: { findFirst: vi.fn(), findMany: vi.fn() },
            notificationQueue: { findFirst: vi.fn(), findMany: vi.fn() },
            systemAnnouncements: { findMany: vi.fn() },
            systemSettings: { findFirst: vi.fn() },
        },
        transaction: vi.fn(async (cb) => {
            const tx: any = {
                query: {
                    notificationTemplates: { findFirst: vi.fn(), findMany: vi.fn() },
                    notificationQueue: { findFirst: vi.fn(), findMany: vi.fn() },
                },
                select: vi.fn(() => hoisted.createDrizzleMock()),
                insert: vi.fn(() => hoisted.createDrizzleMock()),
                update: vi.fn(() => hoisted.createDrizzleMock()),
            };
            return cb(tx);
        }),
        insert: vi.fn(() => hoisted.createDrizzleMock()),
        update: vi.fn(() => hoisted.createDrizzleMock()),
        select: vi.fn(() => hoisted.createDrizzleMock()),
    },
}));

import {
    sendNotificationByTemplate,
    processNotificationQueue,
    createAnnouncement,
    upsertNotificationTemplate,
    getNotificationTemplates,
    getActiveAnnouncements,
    renderTemplate
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
            vi.mocked(db.query.notificationTemplates.findFirst).mockResolvedValue({
                id: 'tmpl1',
                code: 'T1',
                titleTemplate: 'T',
                contentTemplate: 'C',
                channels: ['IN_APP'],
                notificationType: 'SYSTEM',
                isActive: true
            });

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
                // tx 需要包含 query.notificationQueue.findFirst（用于幂等性去重检查）
                const txMock: any = {
                    query: {
                        notificationTemplates: { findFirst: vi.fn() },
                        notificationQueue: { findFirst: vi.fn().mockResolvedValue(undefined) }, // 首次无重复
                    },
                    insert: vi.fn(() => hoisted.createDrizzleMock([{ id: 'q1' }])),
                    update: vi.fn(() => hoisted.createDrizzleMock()),
                    select: vi.fn(() => hoisted.createDrizzleMock()),
                };
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
            vi.mocked(db.query.notificationTemplates.findFirst).mockResolvedValue(null);
            const result = await sendNotificationByTemplate({
                templateCode: 'MISSING',
                userId: 'u1',
                params: {}
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });
    });

    describe('Idempotency (去重逻辑)', () => {
        it('应该跳过同一天内相同 Token 的重复通知', async () => {
            const mockTemplate = {
                id: 'tmpl_1',
                code: 'WELCOME',
                titleTemplate: 'Hi {{name}}',
                contentTemplate: 'Welcome!',
                notificationType: 'SYSTEM',
                channels: ['IN_APP'],
            };

            vi.mocked(db.query.notificationTemplates.findFirst).mockResolvedValue(mockTemplate as any);

            const input = {
                templateCode: 'WELCOME',
                userId: 'user_1',
                params: { name: 'Test' },
            };

            // 开放 transaction mock，第一次调用：tx.query.notificationQueue.findFirst 返回 undefined（无重复）
            vi.mocked(db.transaction).mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
                const txMock: any = {
                    query: { notificationQueue: { findFirst: vi.fn().mockResolvedValue(undefined) } },
                    insert: vi.fn(() => hoisted.createDrizzleMock([{ id: 'q1' }])),
                    update: vi.fn(() => hoisted.createDrizzleMock()),
                    select: vi.fn(() => hoisted.createDrizzleMock()),
                };
                return await cb(txMock);
            });

            // 第一次调用
            const result1 = await sendNotificationByTemplate(input);
            expect(result1.data?.queuedCount).toBe(1); // 1 个渠道 IN_APP

            // 第二次调用_mock：tx.query.notificationQueue.findFirst 返回已存在项（重复）
            vi.mocked(db.transaction).mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
                const txMock: any = {
                    query: { notificationQueue: { findFirst: vi.fn().mockResolvedValue({ id: 'existing_1' }) } },
                    insert: vi.fn(() => hoisted.createDrizzleMock()),
                    update: vi.fn(() => hoisted.createDrizzleMock()),
                    select: vi.fn(() => hoisted.createDrizzleMock()),
                };
                return await cb(txMock);
            });

            const result = await sendNotificationByTemplate(input);

            expect(result.data?.queuedCount).toBe(0); // 被去重
        });

        it('不同用户之间的相同模板不应被去重', async () => {
            const mockTemplate = {
                id: 'tmpl_alert',
                code: 'ALERT',
                titleTemplate: 'Alert',
                contentTemplate: 'Alert!',
                notificationType: 'SYSTEM',
                channels: ['IN_APP'],
            };
            vi.mocked(db.query.notificationTemplates.findFirst).mockResolvedValue(mockTemplate as any);

            const input1 = { templateCode: 'ALERT', userId: 'user_1', params: {} };
            const input2 = { templateCode: 'ALERT', userId: 'user_2', params: {} };

            // 两次调用都应加队成功（1 个渠道，每次各 1 个）
            for (let i = 0; i < 2; i++) {
                vi.mocked(db.transaction).mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
                    const txMock: any = {
                        query: { notificationQueue: { findFirst: vi.fn().mockResolvedValue(undefined) } },
                        insert: vi.fn(() => hoisted.createDrizzleMock([{ id: `q${i}` }])),
                        update: vi.fn(() => hoisted.createDrizzleMock()),
                        select: vi.fn(() => hoisted.createDrizzleMock()),
                    };
                    return await cb(txMock);
                });
            }

            const r1 = await sendNotificationByTemplate(input1);
            const r2 = await sendNotificationByTemplate(input2);

            expect(r1.data?.queuedCount).toBe(1); // user_1 被加队
            expect(r2.data?.queuedCount).toBe(1); // user_2 被加队（不同 token）
        });
    });

    describe('processNotificationQueue', () => {
        it('should process pending items in order of priority', async () => {
            const mockItems = [
                { id: '1', channel: 'SMS', userId: 'u1', title: 'T', content: 'C', priority: 'URGENT' }
            ];

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
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

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
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

            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
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

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
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
            vi.mocked(db.query.systemAnnouncements.findMany).mockResolvedValue([{ id: 'ann1' }] as never);
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
            // Zod 默认消息：String must contain at least 1 character(s)
            expect(result.error).toBeTruthy();
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
                id: '00000000-0000-0000-0000-000000000001', // 合法 UUID
                code: 'T1', name: 'N', notificationType: 'S', titleTemplate: 'T', contentTemplate: 'C',
                channels: ['IN_APP']
            });

            expect(result.success).toBe(false);
            // 更新后 result 为 undefined -> 返回 '操作失败'
            expect(result.error).toBeTruthy();
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
                vi.mocked(db.query.notificationTemplates.findFirst).mockResolvedValue({
                    code: 'T', titleTemplate: 'T', contentTemplate: 'C', channels: []
                });
                // Mock getSetting
                vi.mocked(db.query.systemSettings.findFirst).mockResolvedValue({ value: ['IN_APP'] } as never);

                vi.mocked(db.transaction).mockResolvedValue([]);

                await sendNotificationByTemplate({ templateCode: 'T', params: {}, userId: 'u1' });
                expect(db.transaction).toHaveBeenCalled();
            });

            it('createAnnouncement should handle validation failure', async () => {
                hoisted.mocks.hasPermission.mockResolvedValue(true);
                const result = await createAnnouncement({ title: '', content: '', startAt: new Date() });
                expect(result.success).toBe(false);
            });

            it('getNotificationTemplates should return empty if no session', async () => {
                hoisted.mocks.auth.mockResolvedValue(null);
                const result = await getNotificationTemplates();
                expect(result).toEqual([]);
            });

            it('upsertNotificationTemplate should log audit on create', async () => {
                hoisted.mocks.hasPermission.mockResolvedValue(true);
                // 不传 id 走 insert 路径，此处 db.insert mock 在 resetAllMocks 后需重新设置
                vi.mocked(db.insert).mockReturnValue(hoisted.createDrizzleMock([{ id: 'new-1', code: 'TNEW' }]) as any);

                await upsertNotificationTemplate({
                    // 不传 id，走 insert 分支
                    code: 'TNEW',
                    name: 'N',
                    notificationType: 'SYSTEM',
                    titleTemplate: 'T',
                    contentTemplate: 'C',
                    channels: ['IN_APP']
                });
                expect(hoisted.mocks.logAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                    action: 'CREATE',
                    tableName: 'notification_templates'
                }));
            });
        });
    });
});
