import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升 mock 定义
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    revalidatePath: vi.fn(),
    logAudit: vi.fn(),
    dbFindFirst: vi.fn(),
    dbFindMany: vi.fn(),
}));

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath,
    revalidateTag: vi.fn(),
}));
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mocks.logAudit },
}));

// Mock DB - reminder-actions 通过 runner（db 或 tx）执行查询
vi.mock('@/shared/api/db', () => {
    const createUpdateChain = () => ({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
        }),
    });
    const createInsertChain = () => ({
        values: vi.fn().mockResolvedValue({}),
    });

    const makeTx = () => ({
        query: {
            systemSettings: {
                findFirst: mocks.dbFindFirst,
                findMany: mocks.dbFindMany,
            },
        },
        update: vi.fn().mockReturnValue(createUpdateChain()),
        insert: vi.fn().mockReturnValue(createInsertChain()),
    });

    return {
        db: {
            query: {
                systemSettings: {
                    findFirst: mocks.dbFindFirst,
                    findMany: mocks.dbFindMany,
                },
            },
            update: vi.fn().mockReturnValue(createUpdateChain()),
            insert: vi.fn().mockReturnValue(createInsertChain()),
            transaction: vi.fn(async (callback) => await callback(makeTx())),
        },
    };
});

// 必须在 vi.mock 之后 import
import {
    getReminderRules,
    createReminderRule,
    updateReminderRule,
    deleteReminderRule,
} from '../reminder-actions';

describe('ReminderActions', () => {
    const mockTenantId = 'tenant-1';
    const mockUserId = 'user-1';
    const mockSession = {
        user: { id: mockUserId, tenantId: mockTenantId, role: 'ADMIN' },
    };

    const mockRules = [
        {
            id: 'rule-1',
            name: '线索跟进提醒',
            module: 'leads',
            triggerType: 'no_follow_up',
            days: 3,
            isActive: true,
        },
        {
            id: 'rule-2',
            name: '客户回访提醒',
            module: 'customers',
            triggerType: 'no_visit',
            days: 7,
            isActive: false,
        },
    ];

    // 模拟系统设置中存储的提醒规则
    const mockSettingWithRules = {
        id: 'setting-1',
        tenantId: mockTenantId,
        key: 'REMINDER_RULES',
        value: JSON.stringify(mockRules),
        valueType: 'JSON',
        category: 'NOTIFICATION',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.checkPermission.mockResolvedValue(undefined);
    });

    // === getReminderRules 测试 ===
    describe('getReminderRules', () => {
        it('应返回规则列表', async () => {
            mocks.dbFindFirst.mockResolvedValue(mockSettingWithRules);

            const result = await getReminderRules();

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('线索跟进提醒');
        });

        it('规则不存在时返回空数组', async () => {
            mocks.dbFindFirst.mockResolvedValue(null);

            const result = await getReminderRules();

            expect(result).toEqual([]);
        });
    });

    // === createReminderRule 测试 ===
    describe('createReminderRule', () => {
        it('应成功创建提醒规则', async () => {
            // getReminderRules 调用（在事务中）
            mocks.dbFindFirst.mockResolvedValue(mockSettingWithRules);

            const result = await createReminderRule({
                name: '新提醒规则',
                module: 'orders',
                triggerType: 'overdue',
                days: 5,
                isActive: true,
            });

            expect(result.success).toBe(true);
        });

        it('未授权时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);

            const result = await createReminderRule({
                name: '新提醒规则',
                module: 'orders',
                triggerType: 'overdue',
                days: 5,
                isActive: true,
            });

            expect(result.success).toBe(false);
        });
    });

    // === updateReminderRule 测试 ===
    describe('updateReminderRule', () => {
        it('应成功更新提醒规则', async () => {
            mocks.dbFindFirst.mockResolvedValue(mockSettingWithRules);

            const result = await updateReminderRule('rule-1', {
                name: '更新后的提醒',
                days: 5,
            });

            expect(result.success).toBe(true);
        });

        it('规则不存在时应返回错误', async () => {
            // getReminderRules 返回有效的规则列表，但目标 ID 不在其中
            mocks.dbFindFirst.mockResolvedValue(mockSettingWithRules);

            const result = await updateReminderRule('nonexistent-rule', {
                name: '不存在的规则',
            });

            expect(result.success).toBe(false);
            // reminder-actions.ts 返回 { success: false, message: '规则不存在' }
            expect(result.message).toContain('不存在');
        });
    });

    // === deleteReminderRule 测试 ===
    describe('deleteReminderRule', () => {
        it('应成功删除提醒规则', async () => {
            mocks.dbFindFirst.mockResolvedValue(mockSettingWithRules);

            const result = await deleteReminderRule('rule-1');

            expect(result.success).toBe(true);
        });
    });
});
