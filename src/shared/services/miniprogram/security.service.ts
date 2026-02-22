import { logger } from '@/shared/lib/logger';

/**
 * 轻量级安全服务：限频 & 幂等控制 (Idempotency & Rate Limit)
 *
 * 在生产环境中建议替换基于 Redis 的分布式存储。
 * 当前使用受控的基于 LRU 思想的内存 Map 以满足演示与隔离级容器运行。
 */

// ===================== 1. Idempotency (幂等与防重放) =====================

interface IdempotencyRecord {
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    response?: unknown;
    expiresAt: number;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL = 1000 * 60 * 60 * 24; // 默认保存 24 小时

export class IdempotencyGuard {
    /**
     * 检查并尝试获取当前冲突状态记录，但不修改状态。
     * 采用惰性清理策略，在 check 时触发过期键回收。
     * 
     * @param key 幂等控制键 (通常跨多实例唯一，如租户ID+用户ID+请求业务ID)
     * @returns 当前的执行状态记录 ('PROCESSING' | 'COMPLETED' | 'FAILED')
     */
    static check(key: string): IdempotencyRecord | null {
        this.cleanup();
        return idempotencyStore.get(key) || null;
    }

    /**
     * 开始一项幂等操作，写入 'PROCESSING' 占位符。
     * 请确保随后调用 complete 或 fail，并在 check 命中 PROCESSING 时按业务逻辑重试或报错。
     * 
     * @param key 幂等控制键
     */
    static start(key: string) {
        idempotencyStore.set(key, {
            status: 'PROCESSING',
            expiresAt: Date.now() + IDEMPOTENCY_TTL
        });
    }

    /**
     * 完成操作并记录成功响应以便于重放时直接返回
     */
    static complete(key: string, response: unknown) {
        idempotencyStore.set(key, {
            status: 'COMPLETED',
            response,
            expiresAt: Date.now() + IDEMPOTENCY_TTL
        });
    }

    /**
     * 操作失败，清理键位以允许重试
     */
    static fail(key: string) {
        idempotencyStore.delete(key);
    }

    /** 定期清理过期键 */
    private static cleanup() {
        const now = Date.now();
        for (const [key, record] of idempotencyStore.entries()) {
            if (record.expiresAt < now) {
                idempotencyStore.delete(key);
            }
        }
    }
}

// ===================== 2. Rate Limiting (频控) =====================

interface RateLimitRecord {
    tokens: number;
    lastRefilledAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export class RateLimiter {
    /**
     * 简单令牌桶限流算法实现。
     * 适合防御 CC 攻击、爬虫及高变动接口的饱和式请求。
     * 
     * @param key 限流维度键 (通常为 UserContext:Action:Target)
     * @param maxTokens 桶最大容量 (Burst Capacity)
     * @param refillRateMs 令牌恢复速率 (产生 1 个令牌所需的毫秒数)
     * @returns 是否允许放行 (true 为允许，false 为超速)
     * 
     * @example
     * if (!RateLimiter.allow(`post:${userId}`, 3, 5000)) return error('Too fast');
     */
    static allow(key: string, maxTokens: number = 10, refillRateMs: number = 1000): boolean {
        const now = Date.now();
        const record = rateLimitStore.get(key) || { tokens: maxTokens, lastRefilledAt: now };

        // 补给计算
        const timePassed = now - record.lastRefilledAt;
        const tokensToAdd = Math.floor(timePassed / refillRateMs);

        if (tokensToAdd > 0) {
            record.tokens = Math.min(maxTokens, record.tokens + tokensToAdd);
            record.lastRefilledAt = now;
        }

        if (record.tokens > 0) {
            record.tokens -= 1;
            rateLimitStore.set(key, record);
            return true;
        }

        logger.warn('[Security] Rate limit exceeded', { key, maxTokens });
        return false;
    }

    /** 强制清理释放内存 */
    static reset(key: string) {
        rateLimitStore.delete(key);
    }
}
