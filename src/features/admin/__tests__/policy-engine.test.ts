import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PolicyEngine, WorkingHoursPolicy, type PolicyContext } from '../admin-policy-engine';

// Mock logger
vi.mock('@/shared/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('PolicyEngine - 策略引擎单元测试', () => {
    const mockContext: PolicyContext = {
        userId: 'user-123',
        tenantId: 'tenant-a',
        action: 'TEST_ACTION',
        resource: 'test_resource',
        timestamp: new Date('2024-01-01T10:00:00Z'),
    };

    beforeEach(() => {
        // 由于 rules 是静态私有的，我们通过重置类状态来模拟清理环境
        // 在真实生产代码中，可能需要特殊的辅助函数来清理 rules 用于测试
        (PolicyEngine as any).rules = [];
        vi.clearAllMocks();
    });

    it('如果没有注册规则，默认应该允许访问', async () => {
        const result = await PolicyEngine.evaluate(mockContext);
        expect(result.allowed).toBe(true);
    });

    it('能够正确注册并执行规则', async () => {
        const mockRule = {
            name: 'MockRule',
            description: '测试规则',
            evaluate: vi.fn().mockResolvedValue({ allowed: true }),
        };
        PolicyEngine.registerRule(mockRule);

        const result = await PolicyEngine.evaluate(mockContext);
        expect(result.allowed).toBe(true);
        expect(mockRule.evaluate).toHaveBeenCalledWith(mockContext);
    });

    it('一票否决制：只要有一个规则拒绝，整体就拒绝', async () => {
        const rule1 = {
            name: 'Rule1',
            description: '允许规则',
            evaluate: vi.fn().mockResolvedValue({ allowed: true }),
        };
        const rule2 = {
            name: 'Rule2',
            description: '拒绝规则',
            evaluate: vi.fn().mockResolvedValue({ allowed: false, reason: '权限不足' }),
        };
        const rule3 = {
            name: 'Rule3',
            description: '不应该被执行',
            evaluate: vi.fn().mockResolvedValue({ allowed: true }),
        };

        PolicyEngine.registerRule(rule1);
        PolicyEngine.registerRule(rule2);
        PolicyEngine.registerRule(rule3);

        const result = await PolicyEngine.evaluate(mockContext);

        expect(result.allowed).toBe(false);
        if (!result.allowed) {
            expect(result.reason).toBe('权限不足');
        }
        expect(rule1.evaluate).toHaveBeenCalled();
        expect(rule2.evaluate).toHaveBeenCalled();
        expect(rule3.evaluate).not.toHaveBeenCalled(); // 后续规则不应执行（短路效应）
    });

    describe('WorkingHoursPolicy - 工作时间策略测试', () => {
        it('在工作时间内（10:00）应该允许访问', async () => {
            const ctx: PolicyContext = {
                ...mockContext,
                timestamp: new Date('2024-01-01T10:00:00'), // 本地时间
            };
            const result = await WorkingHoursPolicy.evaluate(ctx);
            expect(result.allowed).toBe(true);
        });

        it('在非工作时间（深夜 23:30）应该拒绝访问', async () => {
            const ctx: PolicyContext = {
                ...mockContext,
                timestamp: new Date('2024-01-01T23:30:00'), // 限制时间段
            };
            const result = await WorkingHoursPolicy.evaluate(ctx);
            expect(result.allowed).toBe(false);
            if (!result.allowed) {
                expect(result.reason).toContain('非工作时间');
            }
        });

        it('在非工作时间（凌晨 01:00）应该拒绝访问', async () => {
            const ctx: PolicyContext = {
                ...mockContext,
                timestamp: new Date('2024-01-01T01:00:00'), // 限制时间段
            };
            const result = await WorkingHoursPolicy.evaluate(ctx);
            expect(result.allowed).toBe(false);
            if (!result.allowed) {
                expect(result.reason).toContain('非工作时间');
            }
        });
    });
});
