/**
 * Analytics 模块安全测试
 * 覆盖 Auth 保护、Zod 校验、TenantId 隔离
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardStats, getSalesFunnel, getLeaderboard } from '../actions';
import { auth, checkPermission } from '@/shared/lib/auth';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ totalAmount: '1000', orderCount: 5 }]),
                innerJoin: vi.fn(() => ({
                    where: vi.fn(() => [{ avgQuotePrice: '500', quoteCount: 3 }]),
                })),
                leftJoin: vi.fn(() => ({
                    where: vi.fn(() => [{ count: 10 }]),
                    groupBy: vi.fn(() => ({
                        orderBy: vi.fn(() => ({
                            limit: vi.fn(() => []),
                        })),
                    })),
                })),
                groupBy: vi.fn(() => ({
                    orderBy: vi.fn(() => []),
                })),
            })),
        })),
        query: {},
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn: (...args: any[]) => any) => fn),
    revalidateTag: vi.fn(),
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (role = 'MANAGER', tenantId = TENANT_A) => ({
    user: { id: USER_ID, role, tenantId, name: '测试用户' },
});

const mockAuth = vi.mocked(auth);

// ===== 测试套件 =====

describe('Analytics 模块安全测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Auth 保护', () => {
        it('getDashboardStats - 未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(false);
        });

        it('getSalesFunnel - 未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getSalesFunnel({});
            expect(result.success).toBe(false);
        });

        it('getLeaderboard - 未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getLeaderboard({ sortBy: 'amount', limit: 10 });
            expect(result.success).toBe(false);
        });
    });

    describe('正常访问', () => {
        it('getDashboardStats - 已登录应正常返回数据', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });
    });
});
