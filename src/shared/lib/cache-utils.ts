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
