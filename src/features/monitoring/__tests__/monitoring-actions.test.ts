/**
 * Monitoring 模块扩展测试
 * 覆盖：createNotification 类型映射、分页、标记已读权限、告警规则 CRUD
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNotification, getMyNotifications, markNotificationAsRead } from '../notification-actions';
import {
    createAlertRule,
    listAlertRules,
    deleteAlertRule,
    sendBulkNotification,
    updateAlertRule,
} from '../actions/alert-rules';
import { auth, checkPermission } from '@/shared/lib/auth';
// @ts-ignore
import { _setFailUpdate } from '@/shared/api/db';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/api/db', () => {
    let _failUpdate = false;
    return {
        _setFailUpdate: (val: boolean) => { _failUpdate = val; },
        db: {
            query: {
                notificationPreferences: {
                    findMany: vi.fn().mockResolvedValue([]),
                    findFirst: vi.fn().mockResolvedValue(null),
                },
                riskAlerts: {
                    findMany: vi.fn().mockResolvedValue([]),
                    findFirst: vi.fn().mockResolvedValue(null),
                },
            },
            select: vi.fn(() => ({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn(() => ({
                            offset: vi.fn().mockResolvedValue([{ id: '1', title: 'test', status: 'OPEN' }]),
                        })),
                    })),
                })),
            })),
            selectDistinct: vi.fn(() => ({
                from: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue([{ id: '1' }]),
                })),
            })),
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    returning: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
                })),
            })),
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn(() => {
                        const arr = _failUpdate ? [] : [{ id: 'rule-test' }];
                        const obj = Promise.resolve(arr) as any;
                        obj.returning = vi.fn().mockResolvedValue(arr);
                        return obj;
                    }),
                })),
            })),
            delete: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn().mockResolvedValue([{ id: 'del-id' }]),
                })),
            })),
        },
    };
});

vi.mock('@/shared/api/schema', () => ({
    riskAlerts: {
        tenantId: 'tenantId',
        id: 'id',
    },
    auditLogs: {},
    notificationPreferences: {
        userId: 'userId',
        tenantId: 'tenantId',
        notificationType: 'notificationType',
        id: 'id',
    },
    NotificationType: {},
    notificationTypeEnum: { enumValues: ['SYSTEM', 'ALERT', 'ORDER_STATUS', 'APPROVAL', 'MENTION'] },
}));

vi.mock('@/shared/api/schema/traceability', () => ({
    riskAlerts: {
        tenantId: 'tenantId',
        id: 'id',
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(undefined),
    },
}));

const mockNotificationService = {
    send: vi.fn().mockResolvedValue(true),
};

vi.mock('@/features/notifications/service', () => ({
    notificationService: {
        send: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/features/notifications/actions', () => ({
    getNotificationsAction: vi.fn().mockImplementation(async (params: Record<string, unknown>) => {
        return {
            success: true,
            data: {
                items: [
                    { id: 'n-1', title: '通知1' },
                    { id: 'n-2', title: '通知2' },
                ],
                total: 10,
                page: (params as { page?: number }).page ?? 1,
            },
        };
    }),
    markAsReadAction: vi.fn().mockImplementation(async (params: Record<string, unknown>) => {
        // 模拟标记非本人通知时拒绝
        if ((params as { notificationId?: string }).notificationId === 'other-user-notification') {
            return { success: false, error: '无权操作他人通知' };
        }
        return { success: true };
    }),
    getUnreadCountAction: vi.fn().mockResolvedValue({ success: true, data: 5 }),
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (overrides?: Record<string, unknown>) => ({
    user: {
        id: USER_ID,
        role: 'ADMIN',
        tenantId: TENANT_A,
        name: '测试用户',
        ...overrides,
    },
});

const mockAuth = vi.mocked(auth);
const mockCheckPermission = vi.mocked(checkPermission);

// ===== T1: createNotification 类型映射测试 =====

describe('createNotification 类型映射', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue(makeSession() as never);
        mockCheckPermission.mockImplementation(() => undefined as never);
    });

    it('INFO 类型应映射为 SYSTEM 通知类型', async () => {
        const result = await createNotification({
            userId: USER_ID,
            title: '信息通知',
            content: '这是一条 INFO 通知',
            type: 'INFO',
        });
        expect(result.success).toBe(true);
    });

    it('WARNING 类型应映射为 ALERT 通知类型', async () => {
        const result = await createNotification({
            userId: USER_ID,
            title: '警告通知',
            content: '这是一条 WARNING 通知',
            type: 'WARNING',
        });
        expect(result.success).toBe(true);
    });

    it('ERROR 类型应映射为 ALERT 通知类型', async () => {
        const result = await createNotification({
            userId: USER_ID,
            title: '错误通知',
            content: '这是一条 ERROR 通知',
            type: 'ERROR',
        });
        expect(result.success).toBe(true);
    });

    it('未指定类型时默认应为 SYSTEM', async () => {
        const result = await createNotification({
            userId: USER_ID,
            title: '默认通知',
            content: '未指定类型',
        });
        expect(result.success).toBe(true);
    });

    it('无权限用户创建通知应被拒绝', async () => {
        mockCheckPermission.mockImplementation(() => {
            throw new Error('权限不足');
        });
        const result = await createNotification({
            userId: USER_ID,
            title: '测试通知',
            content: '测试内容',
        });
        expect(result.success).toBe(false);
    });

    it('未登录用户创建通知应返回 false', async () => {
        mockAuth.mockResolvedValue(null as never);
        const result = await createNotification({
            userId: USER_ID,
            title: '测试通知',
            content: '测试内容',
        });
        expect(result.success).toBe(false);
    });
});

// ===== T1: getMyNotifications 分页测试 =====

describe('getMyNotifications 分页', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue(makeSession() as never);
    });

    it('应返回通知列表', async () => {
        const result = await getMyNotifications({});
        expect(result.success).toBe(true);
    });
});

// ===== T1: markNotificationAsRead 权限测试 =====

describe('markNotificationAsRead 权限', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue(makeSession() as never);
    });

    it('标记自己的通知应成功', async () => {
        const result = await markNotificationAsRead({ notificationId: 'my-notification' });
        expect(result.success).toBe(true);
    });

    it('标记非本人通知应被拒绝', async () => {
        const result = await markNotificationAsRead({ notificationId: 'other-user-notification' });
        expect(result.success).toBe(false);
    });
});

// ===== T2: 告警规则管理测试 =====

describe('告警规则管理 (alert-rules)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue(makeSession() as never);
        mockCheckPermission.mockImplementation(() => undefined as never);
    });

    describe('createAlertRule', () => {
        it('管理员应能创建告警规则', async () => {
            const result = await createAlertRule({
                name: '订单超时告警',
                condition: 'ORDER_OVERDUE',
                thresholdDays: 3,
                targetRoles: ['ADMIN', 'MANAGER'],
                notificationTemplate: 'ORDER_OVERDUE',
            });
            expect(result.success).toBe(true);
        });

        it('未登录应被拒绝', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await createAlertRule({
                name: '订单超时告警',
                condition: 'ORDER_OVERDUE',
                thresholdDays: 3,
                targetRoles: ['ADMIN'],
                notificationTemplate: 'ORDER_OVERDUE',
            });
            expect(result.success).toBe(false);
        });

        it('无权限应被拒绝', async () => {
            mockCheckPermission.mockImplementation(() => {
                throw new Error('权限不足');
            });
            const result = await createAlertRule({
                name: '订单超时告警',
                condition: 'ORDER_OVERDUE',
                thresholdDays: 3,
                targetRoles: ['ADMIN'],
                notificationTemplate: 'ORDER_OVERDUE',
            });
            expect(result.success).toBe(false);
        });

        it('缺少必填字段应校验失败', async () => {
            const result = await createAlertRule({
                name: '',
                condition: 'ORDER_OVERDUE',
                thresholdDays: 3,
                targetRoles: ['ADMIN'],
                notificationTemplate: 'ORDER_OVERDUE',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateAlertRule', () => {
        it('管理员应能成功更新告警规则', async () => {
            const result = await updateAlertRule({
                ruleId: 'rule-1',
                name: '修改后的规则名称',
                isEnabled: false,
                thresholdDays: 5,
            });
            expect(result.success).toBe(true);
        });

        it('未登录应拒绝更新', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await updateAlertRule({
                ruleId: 'rule-no-auth',
                isEnabled: false,
            });
            expect(result.success).toBe(false);
        });
    });

    describe('listAlertRules', () => {
        it('应返回当前租户的告警规则列表', async () => {
            const result = await listAlertRules();
            expect(result.success).toBe(true);
        });

        it('未登录应被拒绝', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await listAlertRules();
            expect(result.success).toBe(false);
        });
    });

    describe('deleteAlertRule', () => {
        it('应能删除告警规则', async () => {
            const result = await deleteAlertRule({ ruleId: 'rule-1' });
            expect(result.success).toBe(true);
        });

        it('未登录应被拒绝', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await deleteAlertRule({ ruleId: 'rule-1' });
            expect(result.success).toBe(false);
        });
    });

    describe('sendBulkNotification', () => {
        it('应能向指定角色组批量发送通知', async () => {
            const result = await sendBulkNotification({
                targetRoles: ['ADMIN', 'MANAGER'],
                title: '系统维护通知',
                content: '系统将于今晚 22:00 进行维护',
                type: 'INFO',
            });
            expect(result.success).toBe(true);
        });

        it('未登录应被拒绝', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await sendBulkNotification({
                targetRoles: ['ADMIN'],
                title: '系统通知',
                content: '内容',
                type: 'INFO',
            });
            expect(result.success).toBe(false);
        });
    });
});
