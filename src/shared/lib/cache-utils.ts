/**
 * 服务端缓存工具
 * 
 * 使用 React.cache() 和 LRU 缓存策略优化服务端数据获取
 */
import { cache } from 'react';

/**
 * 创建一个使用 React.cache 的数据获取函数
 * React.cache 在单次请求内自动去重相同参数的调用
 * 
 * @example
 * const getUser = createCachedFetcher(async (id: string) => {
 *   return await db.user.findUnique({ where: { id } });
 * });
 */
export function createCachedFetcher<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
    return cache(fn);
}

/**
 * 简单的内存 LRU 缓存（跨请求）
 * 用于缓存不经常变化的数据
 */
export class LRUCache<K, V> {
    private cache: Map<K, V>;
    private readonly maxSize: number;

    constructor(maxSize: number = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        const item = this.cache.get(key);
        if (item !== undefined) {
            // 移动到末尾（最近使用）
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // 删除最老的项（第一个）
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

// 全局配置缓存实例
export const configCache = new LRUCache<string, unknown>(50);

// 全局用户数据缓存实例
export const userDataCache = new LRUCache<string, unknown>(200);

/**
 * 具有过期时间的缓存 (TTL Cache)
 * 适用于跨请求缓存，并能自动处理数据过期
 */
interface TTLCacheItem<V> {
    value: V;
    expiry: number;
}

export class TTLCache<K, V> {
    private cache: Map<K, TTLCacheItem<V>>;
    private readonly defaultTTL: number; // 默认保留时间（秒）

    constructor(defaultTTLSeconds: number = 300) {
        this.cache = new Map();
        this.defaultTTL = defaultTTLSeconds;
    }

    /**
     * 设置缓存项
     * @param key 键
     * @param value 值
     * @param ttlSeconds 可选的自定义过期时间（秒），不传则使用默认值
     */
    set(key: K, value: V, ttlSeconds?: number): void {
        const ttl = ttlSeconds ?? this.defaultTTL;
        const expiry = Date.now() + ttl * 1000;
        this.cache.set(key, { value, expiry });
    }

    /**
     * 获取缓存项，如果已过期则返回 undefined 并从 Map 中删除
     */
    get(key: K): V | undefined {
        const item = this.cache.get(key);
        if (!item) return undefined;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return undefined;
        }

        return item.value;
    }

    /**
     * 删除指定缓存项
     */
    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * 获取当前有效的缓存数量（不精确，包含已过期但未清理的项）
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * 手动清理所有已过期的项
     */
    purgeExpired(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// 全局仪表盘缓存实例 (默认 5 分钟)
export const dashboardCache = new TTLCache<string, any>(300);
