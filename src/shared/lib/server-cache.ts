/**
 * 跨请求 LRU 缓存
 * 用于缓存频繁读取但不常变化的服务端数据（如租户配置、系统设置）
 * React.cache() 只在单次请求内去重，此缓存跨多次请求生效
 */
import { LRUCache } from 'lru-cache';

// 默认 5 分钟 TTL，最多 500 条记录
const cache = new LRUCache<string, NonNullable<unknown>>({
  max: 500,
  ttl: 5 * 60 * 1000,
});

/**
 * 创建带 LRU 缓存的异步函数包装器
 * @param keyPrefix - 缓存键前缀
 * @param fn - 实际的数据获取函数
 * @param ttl - 可选，自定义 TTL（毫秒）
 */
export function withLRUCache<TArgs extends unknown[], TResult extends NonNullable<unknown>>(
  keyPrefix: string,
  fn: (...args: TArgs) => Promise<TResult>,
  ttl?: number
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const key = `${keyPrefix}:${JSON.stringify(args)}`;
    const cached = cache.get(key) as TResult | undefined;
    if (cached !== undefined) return cached;

    const result = await fn(...args);
    cache.set(key, result as unknown as NonNullable<unknown>, { ttl });
    return result;
  };
}

/** 手动使指定前缀的缓存失效 */
export function invalidateCache(keyPrefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) cache.delete(key);
  }
}

/** 清空所有缓存 */
export function clearAllCache(): void {
  cache.clear();
}
