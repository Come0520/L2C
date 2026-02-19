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
            execute: vi.fn().mockResolvedValue(resolvedValue),
            then: (onFulfilled?: any) => Promise.resolve(resolvedValue).then(onFulfilled),
            catch: (onRejected?: any) => Promise.resolve(resolvedValue).catch(onRejected),
        };
        return chain;
    };

    return { mocks, createDrizzleMock };
});

// Mock 适配器类
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

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            notificationTemplates: { findFirst: vi.fn() },
        },
        transaction: vi.fn(),
        select: vi.fn(() => hoisted.createDrizzleMock([])),
        insert: vi.fn(() => hoisted.createDrizzleMock([])),
        update: vi.fn(() => hoisted.createDrizzleMock([])),
    }
}));

import { renderTemplate, processNotificationQueue } from '../notification-service';
import { db } from '@/shared/api/db';

describe('NotificationService (Template & Queue)', () => {
    beforeEach(() => {
        vi.resetAllMocks(); // 彻底重置，包括已设置的 mockResolvedValue
        hoisted.mocks.auth.mockResolvedValue({ user: { id: 'u1', tenantId: 't1' } });
    });

    describe('renderTemplate', () => {
        it('should replace placeholders', () => {
            expect(renderTemplate('H {{n}}', { n: 'A' })).toBe('H A');
        });
    });

    describe('processNotificationQueue', () => {
        it('should process success', async () => {
            const mockItems = [{ id: '1', channel: 'SMS', userId: 'u1', title: 'T', content: 'C' }];

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
                const txMock = hoisted.createDrizzleMock(mockItems);
                return await cb(txMock);
            });

            hoisted.mocks.smsSend.mockResolvedValue(true);
            vi.mocked(db.update).mockReturnValue(hoisted.createDrizzleMock([]));

            const stats = await processNotificationQueue(1);
            expect(stats.processed).toBe(1);
            expect(stats.success).toBe(1);
        });

        it('should handle failure', async () => {
            const mockItems = [{ id: '2', channel: 'SMS', userId: 'u1', title: 'T', content: 'C', retryCount: 0 }];

            vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
                const txMock = hoisted.createDrizzleMock(mockItems);
                return await cb(txMock);
            });

            // 失败模拟
            hoisted.mocks.smsSend.mockResolvedValue(false);
            vi.mocked(db.update).mockReturnValue(hoisted.createDrizzleMock([]));

            const stats = await processNotificationQueue(1);
            expect(stats.processed).toBe(1);
            expect(stats.failed).toBe(1);
            expect(stats.success).toBe(0);
        });
    });
});
