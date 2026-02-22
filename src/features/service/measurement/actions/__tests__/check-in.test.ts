import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { checkInMeasureTask } from '../check-in';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

/**
 * check-in.ts 使用了 createSafeAction 包装器。
 * createSafeAction 行为：
 *   1. 调用 auth() 检查 session
 *   2. 用 Zod schema 校验输入
 *   3. 调用 handler，handler 返回值放入外层 { data: handlerResult, success: true }
 *   4. handler 内部抛异常会被 catch 为 { error: message, success: false }
 *
 * 因此：
 *   - handler 成功返回 { success: true, data: {...} } →
 *     最终结果 = { data: { success: true, data: {...} }, success: true }
 *   - handler 返回 { success: false, error: '...' } →
 *     最终结果 = { data: { success: false, error: '...' }, success: true }
 *     （因为 handler 本身没有抛异常，createSafeAction 认为执行成功）
 */

// ===== Mock 定义 =====
vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(),
        query: {
            measureTasks: { findFirst: vi.fn() }
        }
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { record: vi.fn() }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/gps-utils', () => ({
    validateGpsCheckIn: vi.fn().mockReturnValue({ valid: true, distance: 50 }),
    calculateLateMinutes: vi.fn().mockReturnValue(0),
}));

vi.mock('@/features/settings/actions/system-settings-actions', () => ({
    getSetting: vi.fn().mockResolvedValue(15),
}));

// ===== 测试主体 =====
describe('checkInMeasureTask', () => {
    const TASK_UUID = '123e4567-e89b-12d3-a456-426614174000';
    const mockSession = { user: { id: 'user-1', tenantId: 'tenant-1' } };

    const baseMockTask = {
        id: TASK_UUID,
        tenantId: 'tenant-1',
        assignedWorkerId: 'user-1',
        status: 'PENDING_VISIT',
        scheduledAt: new Date(Date.now() + 3600_000),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as unknown as Mock).mockResolvedValue(mockSession);
    });

    /** 辅助：创建 transaction mock，自动注入 txMock */
    function setupTx(findFirstResult: unknown, opts?: { throwOnUpdate?: boolean }) {
        const txMock: Record<string, unknown> = {
            query: {
                measureTasks: {
                    findFirst: vi.fn().mockResolvedValue(findFirstResult),
                }
            },
            update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
            }),
        };
        (db.transaction as unknown as Mock).mockImplementation(async (cb) => cb(txMock));
        return txMock;
    }

    it('签到成功 - 正常流程', async () => {
        const txMock = setupTx(baseMockTask);

        const result = await checkInMeasureTask({
            taskId: TASK_UUID, latitude: 30.0, longitude: 120.0,
        });

        // createSafeAction 外层 success=true，内层 data 包含 handler 结果
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.success).toBe(true);
        expect(result.data?.data).toBeDefined();
    });

    it('签到失败 - 任务不存在', async () => {
        setupTx(null); // findFirst 返回 null

        const result = await checkInMeasureTask({
            taskId: TASK_UUID, latitude: 30.0, longitude: 120.0,
        });

        // handler 返回 { success: false, error: ... }，外层仍是 success: true
        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(false);
        expect(result.data?.error).toContain('任务不存在');
    });

    it('签到失败 - 非指派测量师', async () => {
        setupTx({ ...baseMockTask, assignedWorkerId: 'other-user-id' });

        const result = await checkInMeasureTask({
            taskId: TASK_UUID, latitude: 30.0, longitude: 120.0,
        });

        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(false);
        expect(result.data?.error).toContain('只有被指派的测量师才能签到');
    });

    it('签到失败 - 任务已结束', async () => {
        setupTx({ ...baseMockTask, status: 'COMPLETED' });

        const result = await checkInMeasureTask({
            taskId: TASK_UUID, latitude: 30.0, longitude: 120.0,
        });

        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(false);
        expect(result.data?.error).toContain('任务已结束');
    });
});
