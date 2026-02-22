import { logger } from '@/shared/lib/logger';

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

// 采用 Map 构建轻量内存容器以适配 Edge/Serverless 函数短期运行
// 搭配容量阈值以简易模拟 LRU 驱逐策略
const cacheStore = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_KEYS = 2000; // 封顶两千 Key 防止 OOM

/**
 * 通用内存缓存服务 (L5 性能压榨组件)
 * 适用于 Dashboard、字典等高吞吐量、低频更新场景的大对象。
 */
export class CacheService {
    /**
     * 读取指定缓存项
     * 
     * @template T 数据类型
     * @param key 唯一缓存键词
     * @returns 缓存命中则返回 T，缺失、从未设置或已过期则返回 null
     * 
     * @example
     * const data = CacheService.get<User>('user:123');
     */
    static get<T>(key: string): T | null {
        const entry = cacheStore.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            cacheStore.delete(key);
            return null;
        }
        return entry.value as T;
    }

    /**
     * 写入缓存内容。若 Map 容器超过 MAX_CACHE_KEYS (2000) 阈值，
     * 将自动剔除最旧的 (Oldest) 键位以保证 OOM 安全。
     * 
     * @param key 唯一键
     * @param value 待存储对象（支持 POJO、数组、字符串等序列化或非序列化对象）
     * @param ttlMs 有效期（毫秒），默认 5 分钟 (300,000ms)
     * 
     * @example
     * CacheService.set('settings:t1', { theme: 'dark' }, 60000);
     */
    static set(key: string, value: unknown, ttlMs: number = 5 * 60 * 1000) {
        // 容量防护：超出则随机或按插入顺序剔除（Map 会保证 Iterator 顺序即插入顺序，以此清理最老的缓存）
        if (cacheStore.size >= MAX_CACHE_KEYS) {
            const oldestKey = cacheStore.keys().next().value;
            if (oldestKey) cacheStore.delete(oldestKey);
        }

        cacheStore.set(key, {
            value,
            expiresAt: Date.now() + ttlMs
        });
    }

    /**
     * 获得或设置（带穿透防护的回调封装）
     * 自动处理命中判断 -> 缺失触发 fetcher -> 回填存储。
     * 
     * @param key 唯一缓存键（通常需带上 tenantId 和参数特征）
     * @param fetcher 穿透后异步取数的供给函数
     * @param ttlMs 缓存有效期，默认 5 分钟 
     * @returns 命中或新获取的持久化数据
     */
    static async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 5 * 60 * 1000): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            logger.info('[CacheService] HIT', { key });
            return cached;
        }

        logger.info('[CacheService] MISS - fetching fresh data', { key });
        const freshData = await fetcher();

        // 可选：过滤 undefined 等无意义数据，但不妨碍 null 的合法性（防止缓存黑洞）
        if (freshData !== undefined) {
            this.set(key, freshData, ttlMs);
        }

        return freshData;
    }

    /** 强制清理缓存桶 */
    static flushAll() {
        cacheStore.clear();
        logger.info('[CacheService] Flushed all caches');
    }
}
