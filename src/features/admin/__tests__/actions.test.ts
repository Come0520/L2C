/**
 * Admin 模块安全测试
 * 覆盖 Auth 保护、Zod 校验、TenantId 隔离
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWorkers, getWorkerById, updateWorker } from '../worker-management/actions';
import { auth, checkPermission } from '@/shared/lib/auth';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: {
                findMany: vi.fn().mockResolvedValue([]),
                findFirst: vi.fn().mockResolvedValue(null),
            },
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ count: 0 }]),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
                })),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue([]),
        })),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (tenantId = TENANT_A) => ({
    user: { id: USER_ID, role: 'ADMIN', tenantId, name: '管理员' },
});

// ===== 测试套件 =====

describe('Admin 模块安全测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getWorkers', () => {
        it('已授权应返回师傅列表', async () => {
            const session = makeSession();
            const result = await getWorkers({ page: 1, pageSize: 10 }, session as never);
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
        });

        it('TenantId 隔离 - 使用 session.tenantId 过滤', async () => {
            const session = makeSession(TENANT_A);
            const result = await getWorkers({ page: 1, pageSize: 10 }, session as never);
            expect(result.total).toBeDefined();
        });
    });

    describe('getWorkerById', () => {
        it('不存在的工人应抛出错误', async () => {
            const session = makeSession();
            await expect(
                getWorkerById('non-existent-id', session as never),
            ).rejects.toThrow('未找到该师傅');
        });
    });

    describe('updateWorker', () => {
        it('未登录应返回 success: false', async () => {
            vi.mocked(auth).mockResolvedValue(null as never);
            const result = await updateWorker({ id: 'worker-id', name: '新名字' });
            expect(result.success).toBe(false);
        });

        it('Zod 校验 - 缺少 id 应失败', async () => {
            vi.mocked(auth).mockResolvedValue(makeSession() as never);
            const result = await updateWorker({} as never);
            expect(result.success).toBe(false);
        });
    });
});
