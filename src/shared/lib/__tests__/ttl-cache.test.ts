import { describe, it, expect, vi } from 'vitest';
import { TTLCache } from '../cache-utils';

describe('TTLCache', () => {
    it('应该能正确设置并获取缓存值', () => {
        const cache = new TTLCache<string, string>(300);
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
    });

    it('缓存过期后应该返回 undefined', async () => {
        vi.useFakeTimers();
        const cache = new TTLCache<string, string>(1); // 1s TTL
        cache.set('key1', 'value1');

        // 前进 1.5 秒
        vi.advanceTimersByTime(1500);

        expect(cache.get('key1')).toBeUndefined();
        vi.useRealTimers();
    });

    it('应该支持自定义 TTL 覆盖默认设置', async () => {
        vi.useFakeTimers();
        const cache = new TTLCache<string, string>(100); // 默认 100s
        cache.set('key1', 'value1', 1); // 自定义 1s

        vi.advanceTimersByTime(1500);
        expect(cache.get('key1')).toBeUndefined();
        vi.useRealTimers();
    });

    it('删除功能应该正常', () => {
        const cache = new TTLCache<string, string>(300);
        cache.set('key1', 'value1');
        cache.delete('key1');
        expect(cache.get('key1')).toBeUndefined();
    });

    it('清空功能应该正常', () => {
        const cache = new TTLCache<string, string>(300);
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.clear();
        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBeUndefined();
    });
});
