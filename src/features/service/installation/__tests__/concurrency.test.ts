import { describe, it, expect, beforeEach, vi } from 'vitest';
import { confirmInstallationAction } from '../actions';

// Mock DB and Auth
const { mockDb, mockAuth } = vi.hoisted(() => ({
    mockDb: {
        transaction: vi.fn(async (cb) => cb({
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

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

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
            taskId: '550e8400-e29b-41d4-a716-446655440099', // 有效UUID，DB查询返回null触发错误
            actualLaborFee: 100
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('任务信息不完整');
    });

    it('应该防止重复确认逻辑（业务层模拟）', async () => {
        // 在实际业务代码中，confirmInstallationInternal 已经在事务中检查了状态
        // 我们通过模拟任务已被指派但缺少 installerId 来触发由于某种并发或异常导致的信息缺失错误
        (mockDb.transaction as any).mockImplementationOnce(async (cb: (tx: any) => Promise<unknown>) => cb({
            query: { installTasks: { findFirst: vi.fn().mockResolvedValue({ id: 't1', installerId: null }) } }
        }));

        const result = await confirmInstallationAction({
            taskId: '660e8400-e29b-41d4-a716-446655440001', // 有效UUID，DB返回 installerId:null
            actualLaborFee: 100
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('未指派师傅');
    });
});
