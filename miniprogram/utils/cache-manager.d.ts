/**
 * 缓存管理器
 * 高频接口本地存储优先 + 网络异步更新策略
 * 减少首屏请求等待，提升感知速度
 */
/**
 * 从本地缓存获取数据
 * @template T - 期望返回的数据类型
 * @param path - API 路径，必须在 CACHE_CONFIGS 中注册
 * @returns 有效期内的缓存数据，过期或不存在则返回 null
 *
 * @example
 * ```typescript
 * const dashboard = getCache<DashboardData>('/dashboard');
 * if (dashboard) {
 *   this.setData({ dashboard });
 * }
 * ```
 */
export declare function getCache<T = unknown>(path: string): T | null;
/**
 * 写入本地缓存
 * @template T - 数据类型
 * @param path - API 路径，必须在 CACHE_CONFIGS 中注册
 * @param data - 要缓存的数据
 *
 * @example
 * ```typescript
 * setCache('/dashboard', res.data);
 * ```
 */
export declare function setCache<T = unknown>(path: string, data: T): void;
/**
 * 清除指定路径的缓存
 * @param path - API 路径
 */
export declare function clearCache(path: string): void;
/**
 * 清除所有缓存
 */
export declare function clearAllCache(): void;
/**
 * 判断指定路径是否在可缓存名单中
 * @param path - API 路径
 * @returns 如果路径已注册在 CACHE_CONFIGS 中则返回 true
 */
export declare function isCacheable(path: string): boolean;
