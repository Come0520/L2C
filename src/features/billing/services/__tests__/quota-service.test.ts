/**
 * QuotaService 单元测试
 *
 * 测试策略：
 * - 使用 vi.mock 完整 inline factory 方式 mock DB（避免 hoisting + TDZ 问题）
 * - 控制 getTenantPlanLimits 返回值模拟不同套餐限额场景
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// =====================================================
// DB Mock — factory 中只使用字面量，不引用外部变量
// =====================================================
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            tenants: { findFirst: vi.fn() },
            tenantMonthlyUsages: { findFirst: vi.fn() },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                onConflictDoUpdate: vi.fn(() => ({ execute: vi.fn().mockResolvedValue([]) })),
                returning: vi.fn().mockResolvedValue([]),
            })),
        })),
        transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb({})),
    },
}));

// =====================================================
// plan-limits Mock
// =====================================================
vi.mock('@/features/billing/lib/plan-limits', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/billing/lib/plan-limits')>();
    return {
        ...actual,
        getTenantPlanLimits: vi.fn(),
    };
});

// =====================================================
// 延迟导入（必须在所有 vi.mock 之后）
// =====================================================
import { db } from '@/shared/api/db';
import { getTenantPlanLimits } from '@/features/billing/lib/plan-limits';
import { QuotaService, QuotaExceededError } from '../quota-service';

// =====================================================
// 辅助数据
// =====================================================
const TENANT_ID = 'tenant-abc-123';
const BASE_TENANT = {
    planType: 'base' as const,
    maxUsers: null,
    purchasedAddons: {},
    purchasedModules: [],
    storageQuota: null,
    trialEndsAt: null,
    isGrandfathered: false,
};
const DEFAULT_LIMITS = {
    maxUsers: Infinity,
    maxCustomers: Infinity,
    maxQuotesPerMonth: 50,
    maxOrdersPerMonth: Infinity,
    maxShowroomProducts: Infinity,
    maxStorageBytes: Infinity,
    maxAiRenderingCredits: 50,
    features: {},
};

// =====================================================
// 测试套件
// =====================================================
describe('QuotaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(db.query.tenants.findFirst).mockResolvedValue(BASE_TENANT as never);
        vi.mocked(db.query.tenantMonthlyUsages.findFirst).mockResolvedValue(null); // 默认 0 条
        vi.mocked(getTenantPlanLimits).mockReturnValue(DEFAULT_LIMITS as never);
    });

    // ——— checkResourceQuota（软上限检查） ———

    describe('checkResourceQuota', () => {
        it('当前用量为 0 时应返回 allowed=true', async () => {
            const result = await QuotaService.checkResourceQuota(TENANT_ID, 'quotesPerMonth');
            expect(result.allowed).toBe(true);
            expect(result.current).toBe(0);
            expect(result.limit).toBe(50);
        });

        it('当前用量 < 限额时应返回 allowed=true', async () => {
            vi.mocked(db.query.tenantMonthlyUsages.findFirst).mockResolvedValue({ usedValue: 30 } as never);
            const result = await QuotaService.checkResourceQuota(TENANT_ID, 'quotesPerMonth');
            expect(result.allowed).toBe(true);
            expect(result.current).toBe(30);
        });

        it('当前用量 >= 限额时应返回 allowed=false 并附带 overRatio', async () => {
            vi.mocked(db.query.tenantMonthlyUsages.findFirst).mockResolvedValue({ usedValue: 55 } as never);
            const result = await QuotaService.checkResourceQuota(TENANT_ID, 'quotesPerMonth');
            expect(result.allowed).toBe(false);
            expect(result.current).toBe(55);
            expect(result.overRatio).toBeGreaterThan(1);
        });

        it('无限额套餐应始终返回 allowed=true', async () => {
            vi.mocked(getTenantPlanLimits).mockReturnValue({
                ...DEFAULT_LIMITS,
                maxQuotesPerMonth: Infinity,
            } as never);
            const result = await QuotaService.checkResourceQuota(TENANT_ID, 'quotesPerMonth');
            expect(result.allowed).toBe(true);
            expect(result.limit).toBe(Infinity);
        });

        it('租户不存在时应放行（返回 allowed=true）', async () => {
            vi.mocked(db.query.tenants.findFirst).mockResolvedValue(null);
            const result = await QuotaService.checkResourceQuota('unknown-tenant', 'quotesPerMonth');
            expect(result.allowed).toBe(true);
        });
    });

    // ——— assertResourceQuota（硬上限断言） ———

    describe('assertResourceQuota', () => {
        it('用量未超限时不抛异常', async () => {
            vi.mocked(db.query.tenantMonthlyUsages.findFirst).mockResolvedValue({ usedValue: 2 } as never);
            vi.mocked(getTenantPlanLimits).mockReturnValue({ ...DEFAULT_LIMITS, maxUsers: 5 } as never);
            await expect(QuotaService.assertResourceQuota(TENANT_ID, 'users')).resolves.toBeUndefined();
        });

        it('用量超限时应抛出 QuotaExceededError，错误信息包含"配额超限"', async () => {
            vi.mocked(db.query.tenantMonthlyUsages.findFirst).mockResolvedValue({ usedValue: 10 } as never);
            vi.mocked(getTenantPlanLimits).mockReturnValue({ ...DEFAULT_LIMITS, maxUsers: 5 } as never);
            await expect(
                QuotaService.assertResourceQuota(TENANT_ID, 'users')
            ).rejects.toThrow(/配额超限/);
        });

        it('抛出的错误应是 QuotaExceededError 实例，含 resource / current / limit 属性', async () => {
            vi.mocked(db.query.tenantMonthlyUsages.findFirst).mockResolvedValue({ usedValue: 10 } as never);
            vi.mocked(getTenantPlanLimits).mockReturnValue({ ...DEFAULT_LIMITS, maxUsers: 5 } as never);
            try {
                await QuotaService.assertResourceQuota(TENANT_ID, 'users');
                expect.fail('应当抛出异常');
            } catch (e) {
                expect(e).toBeInstanceOf(QuotaExceededError);
                const err = e as QuotaExceededError;
                expect(err.resource).toBe('users');
                expect(err.current).toBe(10);
                expect(err.limit).toBe(5);
            }
        });
    });
});
