import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';

// 使用 vi.hoisted 提升 mock 函数定义
const mocks = vi.hoisted(() => ({
    smsSend: vi.fn().mockResolvedValue(true),
    larkSend: vi.fn().mockResolvedValue(true),
    wechatSend: vi.fn().mockResolvedValue(true),
}));

// Mock Dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            notificationPreferences: { findFirst: vi.fn() },
        },
        insert: vi.fn(() => ({
            values: vi.fn().mockReturnThis(),
            execute: vi.fn().mockResolvedValue({}),
        })),
        update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            execute: vi.fn().mockResolvedValue({}),
        })),
    },
}));

// 使用 Class 模拟构造函数行为
vi.mock('../adapters/sms-adapter', () => ({
    SmsAdapter: class { send = mocks.smsSend }
}));
vi.mock('../adapters/lark-adapter', () => ({
    LarkAdapter: class { send = mocks.larkSend }
}));
vi.mock('../adapters/wechat-adapter', () => ({
    WeChatAdapter: class { send = mocks.wechatSend }
}));

// 导入服务
import { notificationService } from '../service';

describe('NotificationService', () => {
    const mockPayload = {
        tenantId: 't1',
        userId: 'u1',
        type: 'SYSTEM' as const,
        title: 'Test Title',
        content: 'Test Content',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.smsSend.mockResolvedValue(true);
        mocks.larkSend.mockResolvedValue(true);
        mocks.wechatSend.mockResolvedValue(true);
    });

    describe('send', () => {
        it('should use forceChannels if provided', async () => {
            await notificationService.send({
                ...mockPayload,
                forceChannels: ['SMS']
            });

            expect(mocks.smsSend).toHaveBeenCalled();
            expect(db.query.notificationPreferences.findFirst).not.toHaveBeenCalled();
        });

        it('should fetch preferences if forceChannels not provided', async () => {
            vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({
                channels: ['LARK']
            });

            await notificationService.send(mockPayload);

            expect(db.query.notificationPreferences.findFirst).toHaveBeenCalled();
            expect(mocks.larkSend).toHaveBeenCalled();
        });

        it('should default to IN_APP if no preferences found', async () => {
            vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue(null);

            await notificationService.send(mockPayload);

            expect(db.insert).toHaveBeenCalled();
        });

        it('should handle partial failures using Promise.allSettled', async () => {
            mocks.smsSend.mockRejectedValueOnce(new Error('SMS Failed'));

            vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({
                channels: ['IN_APP', 'SMS']
            });

            const result = await notificationService.send(mockPayload);

            expect(result).toBe(true); // Still true because IN_APP succeeded
            expect(db.insert).toHaveBeenCalled();
        });

        it('should return false if all channels fail', async () => {
            mocks.smsSend.mockRejectedValue(new Error('SMS Failed'));

            // IN_APP fails
            vi.mocked(db.insert).mockImplementationOnce(() => ({
                values: vi.fn(() => ({
                    execute: vi.fn().mockRejectedValue(new Error('DB Failed'))
                }))
            }));

            const result = await notificationService.send({
                ...mockPayload,
                forceChannels: ['IN_APP', 'SMS']
            });

            expect(result).toBe(false);
        });
    });

    describe('markAsRead', () => {
        it('should update notification status', async () => {
            await notificationService.markAsRead('notif-1', 'u1', 't1');
            expect(db.update).toHaveBeenCalled();
        });
    });
});
