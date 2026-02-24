/**
 * SecurityService 安全服务单元测试
 *
 * 覆盖：IdempotencyGuard（幂等控制）和 RateLimiter（频控限流）两个组件的全部公共 API
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { IdempotencyGuard, RateLimiter } from '@/shared/services/miniprogram/security.service';

describe('SecurityService 安全服务', () => {

    // ===================== IdempotencyGuard 幂等控制 =====================

    describe('IdempotencyGuard - 幂等与防重放', () => {

        beforeEach(() => {
            // 清理所有已存在的幂等记录（通过 fail 方式间接清理已知键）
            vi.clearAllMocks();
        });

        it('未注册的键应返回 null', () => {
            const result = IdempotencyGuard.check(`test-key-${Date.now()}`);
            expect(result).toBeNull();
        });

        it('start 后 check 应返回 PROCESSING 状态', () => {
            const key = `idem-start-${Date.now()}`;
            IdempotencyGuard.start(key);

            const record = IdempotencyGuard.check(key);
            expect(record).not.toBeNull();
            expect(record!.status).toBe('PROCESSING');
        });

        it('complete 后 check 应返回 COMPLETED 状态及响应', () => {
            const key = `idem-complete-${Date.now()}`;
            IdempotencyGuard.start(key);
            IdempotencyGuard.complete(key, { orderId: 'ord-123' });

            const record = IdempotencyGuard.check(key);
            expect(record).not.toBeNull();
            expect(record!.status).toBe('COMPLETED');
            expect(record!.response).toEqual({ orderId: 'ord-123' });
        });

        it('fail 后 check 应返回 null（允许重试）', () => {
            const key = `idem-fail-${Date.now()}`;
            IdempotencyGuard.start(key);
            IdempotencyGuard.fail(key);

            const record = IdempotencyGuard.check(key);
            expect(record).toBeNull();
        });

        it('过期记录应在 check 时被自动清理', () => {
            const key = `idem-expired-${Date.now()}`;
            IdempotencyGuard.start(key);

            // 模拟时间前进超过 TTL（24小时 = 86400000ms）
            const originalNow = Date.now;
            Date.now = () => originalNow() + 86400000 + 1000;

            const record = IdempotencyGuard.check(key);
            expect(record).toBeNull();

            Date.now = originalNow;
        });

        it('完整生命周期：start → complete → 重复请求直接返回缓存', () => {
            const key = `lifecycle-${Date.now()}`;

            // 1. 首次请求 - 检查无冲突
            expect(IdempotencyGuard.check(key)).toBeNull();

            // 2. 开始处理
            IdempotencyGuard.start(key);

            // 3. 并发请求 - 检查到 PROCESSING
            const concurrent = IdempotencyGuard.check(key);
            expect(concurrent!.status).toBe('PROCESSING');

            // 4. 处理完成
            IdempotencyGuard.complete(key, { result: 'success' });

            // 5. 后续请求 - 直接返回缓存
            const replay = IdempotencyGuard.check(key);
            expect(replay!.status).toBe('COMPLETED');
            expect(replay!.response).toEqual({ result: 'success' });
        });
    });

    // ===================== RateLimiter 频控限流 =====================

    describe('RateLimiter - 令牌桶频控', () => {

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('新键的首次请求应被允许', () => {
            const key = `rate-new-${Date.now()}`;
            expect(RateLimiter.allow(key, 5, 1000)).toBe(true);
        });

        it('连续请求超过桶容量应被拒绝', () => {
            const key = `rate-burst-${Date.now()}`;
            const maxTokens = 3;

            // 消耗全部令牌
            expect(RateLimiter.allow(key, maxTokens, 60000)).toBe(true);
            expect(RateLimiter.allow(key, maxTokens, 60000)).toBe(true);
            expect(RateLimiter.allow(key, maxTokens, 60000)).toBe(true);

            // 第 4 次应被拒绝
            expect(RateLimiter.allow(key, maxTokens, 60000)).toBe(false);
        });

        it('令牌耗尽后等待足够时间应恢复', () => {
            const key = `rate-refill-${Date.now()}`;

            // 耗尽令牌
            RateLimiter.allow(key, 1, 1000);
            expect(RateLimiter.allow(key, 1, 1000)).toBe(false);

            // 模拟时间前进 1 秒
            const originalNow = Date.now;
            Date.now = () => originalNow() + 1001;

            // 应获得新令牌
            expect(RateLimiter.allow(key, 1, 1000)).toBe(true);

            Date.now = originalNow;
        });

        it('不同键的限流应独立', () => {
            const key1 = `rate-independent-a-${Date.now()}`;
            const key2 = `rate-independent-b-${Date.now()}`;

            // key1 耗尽
            RateLimiter.allow(key1, 1, 60000);
            expect(RateLimiter.allow(key1, 1, 60000)).toBe(false);

            // key2 仍可用
            expect(RateLimiter.allow(key2, 1, 60000)).toBe(true);
        });

        it('reset 后应恢复全部容量', () => {
            const key = `rate-reset-${Date.now()}`;

            // 耗尽令牌
            RateLimiter.allow(key, 1, 60000);
            expect(RateLimiter.allow(key, 1, 60000)).toBe(false);

            // 重置
            RateLimiter.reset(key);

            // 应恢复
            expect(RateLimiter.allow(key, 1, 60000)).toBe(true);
        });

        it('令牌补给不应超过桶最大容量', () => {
            const key = `rate-cap-${Date.now()}`;
            const maxTokens = 2;

            // 使用 1 个令牌
            RateLimiter.allow(key, maxTokens, 100);

            // 模拟大量时间流逝
            const originalNow = Date.now;
            Date.now = () => originalNow() + 1000000;

            // 应恢复到 maxTokens（不会超过）
            expect(RateLimiter.allow(key, maxTokens, 100)).toBe(true);
            expect(RateLimiter.allow(key, maxTokens, 100)).toBe(true);
            // 第 3 次由于 maxTokens=2，应失败
            // 注意：由于经过长时间会补满，但不会超过 maxTokens
            // 实际上前面两次已消耗全部
            expect(RateLimiter.allow(key, maxTokens, 100)).toBe(false);

            Date.now = originalNow;
        });
    });
});
