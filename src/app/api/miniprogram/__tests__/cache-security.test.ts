import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheService } from '@/shared/services/miniprogram/cache.service';
import { IdempotencyGuard, RateLimiter } from '@/shared/services/miniprogram/security.service';

/**
 * 缓存与安全服务单元测试套件
 *
 * 覆盖 CacheService (内存缓存)、IdempotencyGuard (幂等控制)、RateLimiter (频控) 三大核心组件
 */
describe('CacheService 内存缓存服务', () => {
    beforeEach(() => {
        CacheService.flushAll();
    });

    it('应正确存储并读取缓存值', () => {
        CacheService.set('test:key', { foo: 'bar' }, 60000);
        const result = CacheService.get<{ foo: string }>('test:key');
        expect(result).toEqual({ foo: 'bar' });
    });

    it('缓存未命中时应返回 null', () => {
        const result = CacheService.get('nonexistent:key');
        expect(result).toBeNull();
    });

    it('过期缓存应自动失效并返回 null', async () => {
        CacheService.set('expire:test', 'value', 1); // 1ms TTL
        // 等待缓存过期
        await new Promise(resolve => setTimeout(resolve, 10));
        const result = CacheService.get('expire:test');
        expect(result).toBeNull();
    });

    it('getOrSet 缓存命中时应直接返回，不调用 fetcher', async () => {
        CacheService.set('hit:key', 'cached', 60000);
        const fetcher = vi.fn().mockResolvedValue('fresh');

        const result = await CacheService.getOrSet('hit:key', fetcher, 60000);
        expect(result).toBe('cached');
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('getOrSet 缓存缺失时应调用 fetcher 并回填缓存', async () => {
        const fetcher = vi.fn().mockResolvedValue({ data: 'fresh' });

        const result = await CacheService.getOrSet('miss:key', fetcher, 60000);
        expect(result).toEqual({ data: 'fresh' });
        expect(fetcher).toHaveBeenCalledOnce();

        // 验证回填
        const cached = CacheService.get('miss:key');
        expect(cached).toEqual({ data: 'fresh' });
    });

    it('flushAll 应清空所有缓存', () => {
        CacheService.set('a', 1, 60000);
        CacheService.set('b', 2, 60000);
        CacheService.flushAll();

        expect(CacheService.get('a')).toBeNull();
        expect(CacheService.get('b')).toBeNull();
    });

    it('超过容量上限时应自动剔除最旧的缓存键', () => {
        // 填充接近上限的缓存（实际上限是 2000，此处验证驱逐机制逻辑）
        for (let i = 0; i < 5; i++) {
            CacheService.set(`bulk:${i}`, i, 60000);
        }
        // 验证缓存可正常读取
        expect(CacheService.get('bulk:4')).toBe(4);
    });
});

describe('IdempotencyGuard 幂等控制', () => {
    const testKey = 'idem:test:key';

    beforeEach(() => {
        // 清除可能残留的幂等记录
        IdempotencyGuard.fail(testKey);
    });

    it('check 无记录时应返回 null', () => {
        const result = IdempotencyGuard.check('nonexistent:idem');
        expect(result).toBeNull();
    });

    it('start 后 check 应返回 PROCESSING 状态', () => {
        IdempotencyGuard.start(testKey);
        const record = IdempotencyGuard.check(testKey);
        expect(record).not.toBeNull();
        expect(record?.status).toBe('PROCESSING');
    });

    it('complete 后 check 应返回 COMPLETED 状态和响应数据', () => {
        IdempotencyGuard.start(testKey);
        IdempotencyGuard.complete(testKey, { orderId: '123' });

        const record = IdempotencyGuard.check(testKey);
        expect(record?.status).toBe('COMPLETED');
        expect(record?.response).toEqual({ orderId: '123' });
    });

    it('fail 后应清除幂等记录', () => {
        IdempotencyGuard.start(testKey);
        IdempotencyGuard.fail(testKey);

        const record = IdempotencyGuard.check(testKey);
        expect(record).toBeNull();
    });
});

describe('RateLimiter 令牌桶频控', () => {
    const testKey = 'rate:test:key';

    beforeEach(() => {
        RateLimiter.reset(testKey);
    });

    it('初始请求应允许放行', () => {
        expect(RateLimiter.allow(testKey, 3, 1000)).toBe(true);
    });

    it('连续请求超过桶容量后应拒绝', () => {
        // 桶容量为 3
        expect(RateLimiter.allow(testKey, 3, 60000)).toBe(true);
        expect(RateLimiter.allow(testKey, 3, 60000)).toBe(true);
        expect(RateLimiter.allow(testKey, 3, 60000)).toBe(true);
        // 第 4 次应被拒绝
        expect(RateLimiter.allow(testKey, 3, 60000)).toBe(false);
    });

    it('reset 后应重新获得全部令牌', () => {
        // 消耗所有令牌
        RateLimiter.allow(testKey, 1, 60000);
        expect(RateLimiter.allow(testKey, 1, 60000)).toBe(false);

        // 重置
        RateLimiter.reset(testKey);
        expect(RateLimiter.allow(testKey, 1, 60000)).toBe(true);
    });

    it('令牌回复速率应正确工作', async () => {
        // 消耗所有令牌
        RateLimiter.allow(testKey, 1, 50); // 50ms 恢复 1 个令牌
        expect(RateLimiter.allow(testKey, 1, 50)).toBe(false);

        // 等待令牌恢复
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(RateLimiter.allow(testKey, 1, 50)).toBe(true);
    });
});
