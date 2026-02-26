/**
 * 缓存管理器
 * 高频接口本地存储优先 + 网络异步更新策略
 * 减少首屏请求等待，提升感知速度
 */

/** 缓存条目接口
 * @template T - 被缓存的数据类型
 */
interface CacheEntry<T = unknown> {
    data: T;
    timestamp: number;
    ttl: number;
}

/** 缓存配置表 */
const CACHE_CONFIGS: Record<string, { key: string; ttl: number }> = {
    '/dashboard': { key: 'cache_dashboard', ttl: 60 * 1000 },       // 1 分钟
    '/products': { key: 'cache_products', ttl: 5 * 60 * 1000 },   // 5 分钟
    '/config': { key: 'cache_config', ttl: 10 * 60 * 1000 },  // 10 分钟
    '/channels': { key: 'cache_channels', ttl: 5 * 60 * 1000 },   // 5 分钟
    '/categories': { key: 'cache_categories', ttl: 10 * 60 * 1000 },  // 10 分钟
};

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
export function getCache<T = unknown>(path: string): T | null {
    const config = CACHE_CONFIGS[path];
    if (!config) return null;

    try {
        const raw = wx.getStorageSync(config.key);
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(raw);
        const now = Date.now();

        // 检查是否过期
        if (now - entry.timestamp > entry.ttl) {
            wx.removeStorageSync(config.key);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

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
export function setCache<T = unknown>(path: string, data: T): void {
    const config = CACHE_CONFIGS[path];
    if (!config) return;

    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: config.ttl,
        };
        wx.setStorageSync(config.key, JSON.stringify(entry));
    } catch (err) {
        console.warn('[CacheManager] 写入缓存失败:', err);
    }
}

/**
 * 清除指定路径的缓存
 * @param path - API 路径
 */
export function clearCache(path: string): void {
    const config = CACHE_CONFIGS[path];
    if (!config) return;
    try {
        wx.removeStorageSync(config.key);
    } catch {
        // 忽略
    }
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
    Object.values(CACHE_CONFIGS).forEach(({ key }) => {
        try {
            wx.removeStorageSync(key);
        } catch {
            // 忽略
        }
    });
}

/**
 * 判断指定路径是否在可缓存名单中
 * @param path - API 路径
 * @returns 如果路径已注册在 CACHE_CONFIGS 中则返回 true
 */
export function isCacheable(path: string): boolean {
    return path in CACHE_CONFIGS;
}
