import { Redis } from '@upstash/redis';
import { logger } from '@/shared/lib/logger';

const hasUpstashConfig = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

declare global {
    var redisGlobal: Redis | undefined;
}

/**
 * 全局共享的 Redis 客户端实例
 * 优先使用 Upstash 配置，若未配置则为 null
 * 使用 globalThis 防止 HMR 重复连接
 */
export const redis: Redis | null = hasUpstashConfig
    ? (globalThis.redisGlobal ?? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }))
    : null;

if (process.env.NODE_ENV !== 'production' && redis) {
    globalThis.redisGlobal = redis;
}

if (!hasUpstashConfig && process.env.NODE_ENV === 'production') {
    logger.warn('[Redis] 未检测到 Upstash 配置，Redis 功能将不可用。');
}

