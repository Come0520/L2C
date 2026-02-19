import { describe, it, expect, vi, beforeEach } from 'vitest';
import { splitMeasureTask } from '../mutations';

const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_TENANT_ID = 'tenant-1';
const MOCK_USER_ID = 'user-1';

// --- Mock 提升 (vi.hoisted) ---
const { mockDbQuery, mockDbInsert, mockDbUpdate } = vi.hoisted(() => {
    const insertReturning = vi.fn(async () => [{ id: 'new-task-1' }]);
    const insertValues = vi.fn(() => ({ returning: insertReturning }));
    const insertFn = vi.fn(() => ({ values: insertValues }));

    const updateWhere = vi.fn().mockResolvedValue({ success: true });
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    const updateFn = vi.fn(() => ({ set: updateSet }));

    return {
        mockDbQuery: {
            measureTasks: {
                findFirst: vi.fn(),
            },
        },
        mockDbInsert: insertFn,
        mockDbUpdate: updateFn,
    };
});

// --- Mock 数据库模块 ---
vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        transaction: vi.fn(async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => {
            return await cb({
                query: mockDbQuery,
                insert: mockDbInsert,
                update: mockDbUpdate,
            });
        }),
    },
}));

// --- Mock drizzle-orm 操作符，避免真实 Column 类型校验 ---
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: unknown[]) => args),
    and: vi.fn((...args: unknown[]) => args),
    sql: vi.fn(),
}));

// --- Mock 认证模块 ---
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

// --- Mock 审计服务 ---
vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn(),
    },
}));

// --- Mock 工具函数（注意路径：从 __tests__/ 到 measurement/utils.ts）---
vi.mock('../../utils', () => ({
    generateMeasureNo: vi.fn().mockResolvedValue('M-NEW-001'),
}));

// --- Mock Next.js 缓存 ---
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// --- Mock Drizzle Schema 表对象 ---
vi.mock('@/shared/api/schema', () => ({
    measureTasks: {
        id: 'id',
        tenantId: 'tenantId',
        status: 'status',
        leadId: 'leadId',
        customerId: 'customerId',
    },
    measureTaskSplits: {
        id: 'id',
    },
}));

describe('测量模块 Action: splitMeasureTask', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth } = await import('@/shared/lib/auth');
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID },
        });
    });

    it('应成功拆分任务', async () => {
        // 模拟原任务查询结果
        mockDbQuery.measureTasks.findFirst.mockResolvedValue({
            id: VALID_TASK_ID,
            tenantId: MOCK_TENANT_ID,
            status: 'PENDING',
            leadId: 'lead-1',
            customerId: 'customer-1',
        });

        const input = {
            originalTaskId: VALID_TASK_ID,
            splits: [
                { category: 'CURTAIN', laborFee: 100 },
                { category: 'WALLPAPER', laborFee: 50 },
            ],
            reason: '多品类分拆',
        };

        const result = await splitMeasureTask(input);

        expect(result.success).toBe(true);
        // 验证取消了原任务
        expect(mockDbUpdate).toHaveBeenCalled();
        // 验证创建了新任务和拆分关系记录
        expect(mockDbInsert).toHaveBeenCalled();
    });

    it('已完成任务不可拆分', async () => {
        mockDbQuery.measureTasks.findFirst.mockResolvedValue({
            id: VALID_TASK_ID,
            tenantId: MOCK_TENANT_ID,
            status: 'COMPLETED',
        });

        const input = {
            originalTaskId: VALID_TASK_ID,
            splits: [
                { category: 'CURTAIN' },
                { category: 'WALLPAPER' },
            ],
            reason: '原因',
        };

        const result = await splitMeasureTask(input);

        expect(result.success).toBe(false);
        expect(result.error).toContain('已完成任务不可拆分');
    });

    it('拆分数量少于2应校验失败', async () => {
        const input = {
            originalTaskId: VALID_TASK_ID,
            splits: [{ category: 'CURTAIN' }],
            reason: '原因',
        };

        const result = await splitMeasureTask(input);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
