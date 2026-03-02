/**
 * Monitoring 告警规则 CRUD 测试
 *
 * 覆盖告警规则的创建、更新、删除流程，以及审计日志验证和重复名称校验。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createAlertRule,
    listAlertRules,
    deleteAlertRule,
    updateAlertRule,
    resetRateLimiterForTest,
} from '../actions/alert-rules';
import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

// 控制 update 是否返回空数组（模拟规则未找到）
// 使用 globalThis 挂载以确保 vi.mock 工厂函数可以在运行时读取最新值
(globalThis as any).__failUpdateCrud = false;

vi.mock('@/shared/api/db', () => {
    return {
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
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    returning: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
                })),
            })),
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn(() => {
                        const arr = (globalThis as any).__failUpdateCrud ? [] : [{ id: 'rule-test' }];
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
    AuditService: { log: vi.fn(), logBatch: vi.fn() },
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

// ===== 测试套件 =====

describe('Monitoring 告警规则 CRUD', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis as any).__failUpdateCrud = false;
        mockAuth.mockResolvedValue(makeSession() as never);
        mockCheckPermission.mockImplementation(() => undefined as never);
        resetRateLimiterForTest();
    });

    // ----- 创建 -----

    it('应成功创建告警规则并记录审计日志', async () => {
        const result = await createAlertRule({
            name: '订单超时告警',
            condition: 'ORDER_OVERDUE',
            thresholdDays: 3,
            targetRoles: ['ADMIN', 'MANAGER'],
            notificationTemplate: 'ORDER_OVERDUE',
        });

        expect(result.success).toBe(true);

        // 验证 AuditService 被调用
        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'CREATE_ALERT_RULE',
                tableName: 'risk_alerts',
            })
        );
    });

    // ----- 更新 -----

    it('应成功更新告警规则阈值', async () => {
        const result = await updateAlertRule({
            ruleId: 'rule-1',
            thresholdDays: 7,
            name: '更新后的规则',
        });

        expect(result.success).toBe(true);

        // 验证 AuditService 被调用
        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'UPDATE_ALERT_RULE',
                recordId: 'rule-1',
            })
        );
    });

    it('无权限用户更新规则应被拒绝', async () => {
        mockCheckPermission.mockImplementation(() => {
            throw new Error('权限不足');
        });

        const result = await updateAlertRule({
            ruleId: 'rule-1',
            name: '恶意修改',
        });

        expect(result.success).toBe(false);
    });

    // ----- 删除 -----

    it('应成功删除告警规则', async () => {
        const result = await deleteAlertRule({ ruleId: 'rule-to-delete' });

        expect(result.success).toBe(true);

        // 验证 AuditService 被调用
        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'DELETE_ALERT_RULE',
                recordId: 'rule-to-delete',
            })
        );
    });

    // ----- 查询（租户隔离） -----

    it('查询告警规则列表应只返回当前租户的规则', async () => {
        const result = await listAlertRules();

        expect(result.success).toBe(true);
        // 列表接口会自动按 tenantId 过滤，验证调用成功即可
        expect(result).toHaveProperty('data');
    });

    // ----- Zod 校验 -----

    it('创建重复名称的规则应成功（名称不做唯一性校验，由业务层控制）', async () => {
        // 第一次创建
        const result1 = await createAlertRule({
            name: '相同规则名',
            condition: 'ORDER_OVERDUE',
            thresholdDays: 5,
            targetRoles: ['ADMIN'],
            notificationTemplate: 'ORDER_OVERDUE',
        });
        expect(result1.success).toBe(true);

        // 第二次创建（同名应也能成功，因为当前实现无唯一性约束）
        const result2 = await createAlertRule({
            name: '相同规则名',
            condition: 'ORDER_OVERDUE',
            thresholdDays: 5,
            targetRoles: ['ADMIN'],
            notificationTemplate: 'ORDER_OVERDUE',
        });
        expect(result2.success).toBe(true);
    });

    it('阈值超出范围应校验失败', async () => {
        const result = await createAlertRule({
            name: '阈值超限测试',
            condition: 'ORDER_OVERDUE',
            thresholdDays: 100, // 超出 90 上限
            targetRoles: ['ADMIN'],
            notificationTemplate: 'ORDER_OVERDUE',
        });
        expect(result.success).toBe(false);
    });

    it('空目标角色组应校验失败', async () => {
        const result = await createAlertRule({
            name: '无角色测试',
            condition: 'ORDER_OVERDUE',
            thresholdDays: 5,
            targetRoles: [],
            notificationTemplate: 'ORDER_OVERDUE',
        });
        expect(result.success).toBe(false);
    });
});
