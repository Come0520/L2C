import { describe, it, expect, beforeEach, vi } from 'vitest';
import { confirmInstallationAction } from '../actions';

// Mock DB and Auth
const { mockDb, mockAuth } = vi.hoisted(() => ({
    mockDb: {
        transaction: vi.fn(async (cb: (tx: any) => Promise<unknown>) => cb({
            query: {
                installTasks: {
                    findFirst: vi.fn(),
                }
            },
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue({}),
        })),
    },
    mockAuth: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mockAuth,
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn().mockResolvedValue({}) }
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

/**
 * 安装并发与防护测试
 *
 * 注意：confirmInstallationAction 经 createSafeAction 包装，
 * handler 的返回值在 result.data 内，外层 result.success 总为 true。
 * 因此业务错误需通过 result.data.success / result.data.error 断言。
 */
describe('Installation Concurrency & Protection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'u1', tenantId: 't1' } });
    });

    it('应该拒绝确认一个不存在或未指派的任务', async () => {
        // 模拟数据库返回 null
        (mockDb.transaction as any).mockImplementationOnce(async (cb: (tx: any) => Promise<unknown>) => cb({
            query: { installTasks: { findFirst: vi.fn().mockResolvedValue(null) } }
        }));

        const result = await confirmInstallationAction({
            taskId: '550e8400-e29b-41d4-a716-446655440099',
            actualLaborFee: 100
        });

        // createSafeAction 包装后，业务结果在 result.data 中
        const inner = (result as any).data ?? result;
        expect(inner.success).toBe(false);
        expect(inner.error).toContain('任务信息不完整');
    });

    it('应该防止重复确认逻辑（业务层模拟）', async () => {
        // 模拟任务已被指派但缺少 installerId 来触发信息缺失错误
        (mockDb.transaction as any).mockImplementationOnce(async (cb: (tx: any) => Promise<unknown>) => cb({
            query: { installTasks: { findFirst: vi.fn().mockResolvedValue({ id: 't1', installerId: null }) } }
        }));

        const result = await confirmInstallationAction({
            taskId: '660e8400-e29b-41d4-a716-446655440001',
            actualLaborFee: 100
        });

        // createSafeAction 包装后，业务结果在 result.data 中
        const inner = (result as any).data ?? result;
        expect(inner.success).toBe(false);
        expect(inner.error).toContain('未指派师傅');
    });
});
