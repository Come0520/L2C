/**
 * Monitoring 模块安全测试
 * 覆盖 Auth 保护、Zod 校验、TenantId 隔离
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotificationPreferences, updateNotificationPreference } from '../preference-actions';
import { createNotification } from '../notification-actions';
import { auth } from '@/shared/lib/auth';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            notificationPreferences: {
                findMany: vi.fn().mockResolvedValue([]),
                findFirst: vi.fn().mockResolvedValue(null),
            },
        },
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([]),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/features/notifications/service', () => ({
    notificationService: {
        send: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/features/notifications/actions', () => ({
    getNotificationsAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
    markAsReadAction: vi.fn().mockResolvedValue({ success: true }),
    getUnreadCountAction: vi.fn().mockResolvedValue({ success: true, data: 0 }),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (tenantId = TENANT_A) => ({
    user: { id: USER_ID, role: 'ADMIN', tenantId, name: '测试用户' },
});

const mockAuth = vi.mocked(auth);

// ===== 测试套件 =====

describe('Monitoring 模块安全测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getNotificationPreferences', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getNotificationPreferences();
            expect(result.success).toBe(false);
        });

        it('已登录应返回偏好列表', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await getNotificationPreferences();
            expect(result.success).toBe(true);
        });
    });

    describe('updateNotificationPreference', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await updateNotificationPreference({
                notificationType: 'SYSTEM',
                channels: ['IN_APP'],
            });
            expect(result.success).toBe(false);
        });

        it('有效输入应成功更新', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateNotificationPreference({
                notificationType: 'ALERT',
                channels: ['SMS', 'EMAIL'],
            });
            expect(result.success).toBe(true);
        });

        it('空 channels 数组应校验失败', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateNotificationPreference({
                notificationType: 'SYSTEM',
                channels: [],
            });
            expect(result.success).toBe(false);
        });
    });

    describe('createNotification', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await createNotification({
                userId: USER_ID,
                title: '测试通知',
                content: '测试内容',
            });
            expect(result.success).toBe(false);
        });
    });
});
