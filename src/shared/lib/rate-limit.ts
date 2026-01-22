/**
 * Redis 限流工具
 * 
 * 使用 Upstash Rate Limit 实现分布式限流
 * 适用于 Serverless 环境（Vercel、Cloudflare Workers 等）
 * 
 * 环境变量配置：
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST Token
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 检查 Upstash 配置是否存在
const hasUpstashConfig = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

// 仅在配置存在时初始化 Redis 客户端
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (hasUpstashConfig) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // 创建限流实例：每分钟 100 次请求（滑动窗口）
    ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:webhook',
    });
}

/**
 * 限流结果类型
 */
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    source: 'redis' | 'memory'; // 标识使用的限流来源
}

/**
 * 内存限流（降级方案）
 * 用于未配置 Upstash 的开发环境
 */
const memoryRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60 * 1000; // 1 分钟

let hasWarnedAboutMemory = false;

function memoryRateLimit(identifier: string): RateLimitResult {
    // 生产环境警告
    if (process.env.NODE_ENV === 'production' && !hasWarnedAboutMemory) {
        console.warn(
            '[Rate Limit] 未配置 Upstash Redis，使用内存限流。' +
            '请配置 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN 环境变量。'
        );
        hasWarnedAboutMemory = true;
    }

    const now = Date.now();
    let record = memoryRateLimitMap.get(identifier);

    if (!record || now > record.resetAt) {
        record = { count: 0, resetAt: now + RATE_WINDOW_MS };
        memoryRateLimitMap.set(identifier, record);
    }

    record.count++;
    return {
        allowed: record.count <= RATE_LIMIT,
        remaining: Math.max(0, RATE_LIMIT - record.count),
        resetAt: new Date(record.resetAt),
        source: 'memory',
    };
}

/**
 * 检查限流
 * 
 * 优先使用 Upstash Redis，未配置时降级到内存限流
 * 
 * @param identifier 限流标识符（如 token、IP 等）
 * @returns 限流结果
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
    // 如果配置了 Upstash，使用 Redis 限流
    if (ratelimit) {
        try {
            const result = await ratelimit.limit(identifier);
            return {
                allowed: result.success,
                remaining: result.remaining,
                resetAt: new Date(result.reset),
                source: 'redis',
            };
        } catch (error) {
            // Redis 故障时降级到内存限流
            console.error('[Rate Limit] Redis error, falling back to memory:', error);
            return memoryRateLimit(identifier);
        }
    }

    // 未配置 Upstash，使用内存限流
    return memoryRateLimit(identifier);
}

/**
 * 检查 Upstash 是否已配置
 */
export function isRedisConfigured(): boolean {
    return hasUpstashConfig;
}
