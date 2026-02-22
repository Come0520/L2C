/**
 * 通用速率限制 (Rate Limiting) 中间件
 * 
 * 功能：
 * 1. 按 IP 或 Token 限制请求频率
 * 2. 支持不同 API 端点的差异化限流
 * 3. 优先使用 Upstash Redis 进行分布式限流，自动降级到内存
 * 4. 返回标准 Rate Limit Headers
 */

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/shared/lib/redis';
import { logger } from '@/shared/lib/logger';

// ============================================================
// 类型定义
// ============================================================

/**
 * 限流配置
 */
export interface RateLimitConfig {
    /** 时间窗口内最大请求数 */
    max: number;
    /** 时间窗口（毫秒） */
    windowMs: number;
    /** 限流标识符类型 */
    keyType: 'ip' | 'token' | 'user';
    /** Redis 限流前缀 (可选) */
    prefix?: string;
}

/**
 * 限流来源
 */
export type RateLimitSource = 'redis' | 'memory';

/**
 * 限流检查结果
 */
export interface RateLimitResult {
    /** 是否允许请求 */
    allowed: boolean;
    /** 剩余请求数 */
    remaining: number;
    /** 窗口重置时间 */
    resetAt: Date;
    /** 当前请求数 (仅内存模式准确，Redis 模式可能不返回) */
    current?: number;
    /** 最大请求数 */
    limit: number;
    /** 限流来源 */
    source: RateLimitSource;
}

// ============================================================
// 预设配置
// ============================================================

/**
 * 常用 API 限流配置
 */
export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
    // 登录接口：防止暴力破解
    login: { max: 5, windowMs: 60 * 1000, keyType: 'ip', prefix: 'ratelimit:login' },         // 5次/分钟

    // 短信验证码：防止滥用
    sms: { max: 3, windowMs: 60 * 1000, keyType: 'ip', prefix: 'ratelimit:sms' },           // 3次/分钟

    // 刷新 Token
    refresh: { max: 10, windowMs: 60 * 1000, keyType: 'token', prefix: 'ratelimit:refresh' },   // 10次/分钟

    // Webhook 接口
    webhook: { max: 100, windowMs: 60 * 1000, keyType: 'token', prefix: 'ratelimit:webhook' },  // 100次/分钟

    // 普通 API（已认证用户）
    api: { max: 60, windowMs: 60 * 1000, keyType: 'user', prefix: 'ratelimit:api' },        // 60次/分钟

    // 上传接口
    upload: { max: 10, windowMs: 60 * 1000, keyType: 'user', prefix: 'ratelimit:upload' },     // 10次/分钟
};

// ============================================================
// Redis 初始化
// ============================================================

// Redis 客户端已在 @/shared/lib/redis 中初始化
const redisLimiters = new Map<string, Ratelimit>();

/**
 * 获取或创建 Redis Limiter 实例
 */
function getRedisLimiter(config: RateLimitConfig): Ratelimit | null {
    if (!redis) return null;

    const prefix = config.prefix || 'ratelimit:default';
    const key = `${prefix}:${config.max}:${config.windowMs}`;

    if (!redisLimiters.has(key)) {
        // 将 windowMs 转换为 Upstash 支持的格式 (简单处理：向上取整为秒)
        const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));

        redisLimiters.set(key, new Ratelimit({
            redis: redis!,
            limiter: Ratelimit.slidingWindow(config.max, `${windowSeconds} s`),
            analytics: true,
            prefix: prefix,
        }));
    }

    return redisLimiters.get(key) || null;
}

// ============================================================
// 内存限流存储 (Fallback)
// ============================================================



/**
 * 内存限流存储
 * 注意：生产环境多实例部署时应使用 Redis
 */
class MemoryRateLimitStore {
    // key -> custom store for different configs
    private stores = new Map<string, Map<string, { count: number; resetAt: number }>>();

    private getStore(prefix: string) {
        if (!this.stores.has(prefix)) {
            this.stores.set(prefix, new Map());
        }
        return this.stores.get(prefix)!;
    }

    /**
     * 清理过期记录（定期调用）
     */
    cleanup() {
        const now = Date.now();
        for (const store of this.stores.values()) {
            for (const [key, value] of store.entries()) {
                if (now > value.resetAt) {
                    store.delete(key);
                }
            }
        }
    }

    /**
     * 检查并增加计数
     */
    check(key: string, config: RateLimitConfig): RateLimitResult {
        const now = Date.now();
        const prefix = config.prefix || 'default';
        const store = this.getStore(prefix);

        let record = store.get(key);

        // 重置过期记录
        if (!record || now > record.resetAt) {
            record = { count: 0, resetAt: now + config.windowMs };
            store.set(key, record);
        }

        record.count++;

        return {
            allowed: record.count <= config.max,
            remaining: Math.max(0, config.max - record.count),
            resetAt: new Date(record.resetAt),
            current: record.count,
            limit: config.max,
            source: 'memory',
        };
    }
}

// 全局内存限流存储实例
const memoryStore = new MemoryRateLimitStore();

// 每 10 分钟清理一次过期记录
if (typeof setInterval !== 'undefined') {
    setInterval(() => memoryStore.cleanup(), 10 * 60 * 1000);
}

let hasWarnedAboutMemory = false;

// ============================================================
// 中间件函数
// ============================================================

/**
 * 检查 Upstash 是否已配置
 */
export function isRedisConfigured(): boolean {
    return !!redis;
}

/**
 * 检查速率限制
 * 
 * @param key - 限流标识符（IP、Token 或 UserId）
 * @param presetByOrConfig - 预设配置名称或自定义配置
 * @returns 限流检查结果
 * 
 * @example
 * ```typescript
 * // 在 API Route 中使用
 * const ip = request.headers.get('x-forwarded-for') || 'unknown';
 * const result = await checkRateLimit(ip, 'login');
 * if (!result.allowed) {
 *     return new Response('Too Many Requests', { status: 429 });
 * }
 * ```
 */
export async function checkRateLimit(
    key: string,
    presetByOrConfig: keyof typeof RATE_LIMIT_PRESETS | RateLimitConfig = 'api'
): Promise<RateLimitResult> {
    const config = typeof presetByOrConfig === 'string'
        ? RATE_LIMIT_PRESETS[presetByOrConfig]
        : presetByOrConfig;

    if (!config) {
        throw new Error(`Unknown rate limit preset or invalid config`);
    }

    // 尝试使用 Redis 限流
    const redisLimiter = getRedisLimiter(config);
    if (redisLimiter) {
        try {
            const result = await redisLimiter.limit(key);
            return {
                allowed: result.success,
                remaining: result.remaining,
                resetAt: new Date(result.reset),
                limit: result.limit,
                source: 'redis',
            };
        } catch (error) {
            console.error('[Rate Limit] Redis error, falling back to memory:', error);
            // 降级到内存限流
        }
    } else if (process.env.NODE_ENV === 'production' && !hasWarnedAboutMemory) {
        logger.warn(
            '[Rate Limit] 未配置 Upstash Redis，使用内存限流。' +
            '请配置 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN 环境变量。'
        );
        hasWarnedAboutMemory = true;
    }

    // 使用内存限流
    return memoryStore.check(key, config);
}

/**
 * 生成标准 Rate Limit 响应头
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
        'X-RateLimit-Source': result.source,
    };
}

/**
 * 获取请求 IP 地址
 */
export function getClientIP(request: Request): string {
    const headers = (request.headers as Headers);
    const forwarded = headers.get?.('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return 'unknown';
}
