/**
 * Platform Analytics 模块独立测试
 *
 * 覆盖范围：
 * - getPlatformOverview：权限验证 + 正常返回统计数据 + 数据结构校验
 * - getRegistrationTrend：权限验证 + 正常返回趋势数据 + 空数据处理
 * - getRecentPlatformActivity：权限验证 + 正常返回近期活动 + 数据结构校验
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** ─────────── Hoisted Mock 引用 ─────────── */
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    dbQueryUsersFindFirst: vi.fn(),
    dbSelect: vi.fn(),
}));

/** ─────────── 全局 Mock 配置 ─────────── */

vi.mock('@/shared/lib/auth', () => ({ auth: mocks.auth }));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: { findFirst: mocks.dbQueryUsersFindFirst },
        },
        select: mocks.dbSelect,
    },
}));

vi.mock('@/shared/api/schema', () => ({
    tenants: {
        status: 'status',
        verificationStatus: 'verificationStatus',
        createdAt: 'createdAt',
        reviewedAt: 'reviewedAt',
        updatedAt: 'updatedAt',
    },
    users: { id: 'id', isPlatformAdmin: 'isPlatformAdmin' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: unknown[]) => args),
    sql: vi.fn((...args: unknown[]) => args),
    gte: vi.fn((...args: unknown[]) => args),
    and: vi.fn((...args: unknown[]) => args),
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// unstable_cache 直接执行回调函数，跳过缓存层
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

/** ─────────── 辅助工具 ─────────── */

/** 模拟 select 链式调用（groupBy 结尾） */
function mockSelectGroupBy(result: unknown[]) {
    mocks.dbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue(result),
        }),
    });
}

/** 模拟 select 链式调用（where 结尾，用于 getRecentPlatformActivity） */
function mockSelectWhere(result: unknown[]) {
    mocks.dbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(result),
        }),
    });
}

/** 模拟 select 链式调用（orderBy 结尾，用于 getRegistrationTrend） */
function mockSelectOrderBy(result: unknown[]) {
    mocks.dbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockResolvedValue(result),
                }),
            }),
        }),
    });
}

/** ─────────── 测试常量 ─────────── */
const ADMIN_USER_ID = 'platform-admin-001';

/** ─────────── 测试套件 ─────────── */

describe('Platform Analytics - 独立测试套件', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 默认：已登录的平台管理员
        mocks.auth.mockResolvedValue({ user: { id: ADMIN_USER_ID } });
        mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: true });
    });

    // ═══════════════════════════════════════════
    //  getPlatformOverview 测试
    // ═══════════════════════════════════════════

    describe('getPlatformOverview - 平台概览统计', () => {
        it('未登录时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);

            const { getPlatformOverview } = await import('../actions/platform-analytics');
            const result = await getPlatformOverview();

            expect(result.success).toBe(false);
            expect(result.error).toContain('未登录');
        });

        it('非平台管理员应返回权限错误', async () => {
            mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: false });

            const { getPlatformOverview } = await import('../actions/platform-analytics');
            const result = await getPlatformOverview();

            expect(result.success).toBe(false);
            expect(result.error).toContain('权限');
        });

        it('平台管理员应返回完整的概览统计数据', async () => {
            // 第一次 select 返回租户状态分布，第二次返回认证分布
            let callCount = 0;
            mocks.dbSelect.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return {
                        from: vi.fn().mockReturnValue({
                            groupBy: vi.fn().mockResolvedValue([
                                { status: 'active', count: 15 },
                                { status: 'pending_approval', count: 4 },
                                { status: 'suspended', count: 2 },
                                { status: 'rejected', count: 1 },
                            ]),
                        }),
                    };
                }
                return {
                    from: vi.fn().mockReturnValue({
                        groupBy: vi.fn().mockResolvedValue([
                            { status: 'verified', count: 10 },
                            { status: 'pending', count: 3 },
                            { status: 'rejected', count: 1 },
                        ]),
                    }),
                };
            });

            const { getPlatformOverview } = await import('../actions/platform-analytics');
            const result = await getPlatformOverview();

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.activeCount).toBe(15);
            expect(result.data!.pendingCount).toBe(4);
            expect(result.data!.suspendedCount).toBe(2);
            expect(result.data!.rejectedCount).toBe(1);
            expect(result.data!.totalCount).toBe(22);
            expect(result.data!.verification).toEqual({
                verified: 10,
                pending: 3,
                rejected: 1,
            });
        });

        it('无租户数据时应返回全零统计', async () => {
            mocks.dbSelect.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    groupBy: vi.fn().mockResolvedValue([]),
                }),
            });

            const { getPlatformOverview } = await import('../actions/platform-analytics');
            const result = await getPlatformOverview();

            expect(result.success).toBe(true);
            expect(result.data!.totalCount).toBe(0);
            expect(result.data!.activeCount).toBe(0);
        });
    });

    // ═══════════════════════════════════════════
    //  getRegistrationTrend 测试
    // ═══════════════════════════════════════════

    describe('getRegistrationTrend - 注册趋势', () => {
        it('未登录时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);

            const { getRegistrationTrend } = await import('../actions/platform-analytics');
            const result = await getRegistrationTrend();

            expect(result.success).toBe(false);
            expect(result.error).toContain('未登录');
        });

        it('非平台管理员应返回权限错误', async () => {
            mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: false });

            const { getRegistrationTrend } = await import('../actions/platform-analytics');
            const result = await getRegistrationTrend();

            expect(result.success).toBe(false);
            expect(result.error).toContain('权限');
        });

        it('应返回近30天的注册趋势数据', async () => {
            mockSelectOrderBy([
                { date: '2026-02-18', count: 5 },
                { date: '2026-02-19', count: 3 },
                { date: '2026-02-20', count: 8 },
                { date: '2026-02-21', count: 2 },
            ]);

            const { getRegistrationTrend } = await import('../actions/platform-analytics');
            const result = await getRegistrationTrend();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(4);
            expect(result.data![0]).toEqual({ date: '2026-02-18', count: 5 });
            expect(result.data![3]).toEqual({ date: '2026-02-21', count: 2 });
        });

        it('无注册数据时应返回空数组', async () => {
            mockSelectOrderBy([]);

            const { getRegistrationTrend } = await import('../actions/platform-analytics');
            const result = await getRegistrationTrend();

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });
    });

    // ═══════════════════════════════════════════
    //  getRecentPlatformActivity 测试
    // ═══════════════════════════════════════════

    describe('getRecentPlatformActivity - 近期平台活动', () => {
        it('未登录时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);

            const { getRecentPlatformActivity } = await import('../actions/platform-analytics');
            const result = await getRecentPlatformActivity();

            expect(result.success).toBe(false);
            expect(result.error).toContain('未登录');
        });

        it('非平台管理员应返回权限错误', async () => {
            mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: false });

            const { getRecentPlatformActivity } = await import('../actions/platform-analytics');
            const result = await getRecentPlatformActivity();

            expect(result.success).toBe(false);
            expect(result.error).toContain('权限');
        });

        it('应返回近7天的活动统计', async () => {
            mockSelectWhere([{ count: 5 }]);

            const { getRecentPlatformActivity } = await import('../actions/platform-analytics');
            const result = await getRecentPlatformActivity();

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.recentApprovals).toBe(5);
            expect(typeof result.data!.recentRejections).toBe('number');
            expect(typeof result.data!.recentSuspensions).toBe('number');
        });

        it('无活动数据时应返回全零', async () => {
            mockSelectWhere([{ count: 0 }]);

            const { getRecentPlatformActivity } = await import('../actions/platform-analytics');
            const result = await getRecentPlatformActivity();

            expect(result.success).toBe(true);
            expect(result.data!.recentApprovals).toBe(0);
        });
    });
});
