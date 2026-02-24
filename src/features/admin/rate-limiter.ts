/**
 * 管理操作速率限制器 (Admin Rate Limiter)
 * 
 * 采用简单的内存滑动窗口算法，防止针对管理接口的高频攻击。
 * 生产环境建议替换为 Redis 等持久化存储。
 */

import { logger } from '@/shared/lib/logger';

interface RateLimitRecord {
    timestamps: number[];
}

export class AdminRateLimiter {
    // 内存存储：userId -> { actionType -> timestamps }
    private static storage = new Map<string, Map<string, RateLimitRecord>>();

    /**
     * 默认配置
     * - windowMs: 1分钟
     * - max: 最大次数
     */
    private static CONFIG: Record<string, { windowMs: number; max: number }> = {
        role_mutation: { windowMs: 60 * 1000, max: 5 },    // 角色变更：5次/分钟
        tenant_mutation: { windowMs: 60 * 1000, max: 10 }, // 租户配置：10次/分钟
        worker_mutation: { windowMs: 60 * 1000, max: 20 }, // 师傅管理：20次/分钟
    };

    /**
     * 检查是否触发速率限制
     * @throws 如果触发限制则抛出错误
     */
    static async check(userId: string, actionType: string): Promise<void> {
        const config = this.CONFIG[actionType] || { windowMs: 60 * 1000, max: 10 };
        const now = Date.now();

        let userLimits = this.storage.get(userId);
        if (!userLimits) {
            userLimits = new Map();
            this.storage.set(userId, userLimits);
        }

        let record = userLimits.get(actionType);
        if (!record) {
            record = { timestamps: [] };
            userLimits.set(actionType, record);
        }

        // 清理过期时间戳
        record.timestamps = record.timestamps.filter(t => now - t < config.windowMs);

        if (record.timestamps.length >= config.max) {
            logger.warn(`[RateLimiter] 用户 ${userId} 触发操作限制: ${actionType}`);
            throw new Error(`操作过于频繁，请稍后再试（限制：每 ${config.windowMs / 1000} 秒 ${config.max} 次）`);
        }

        // 记录本次时间戳
        record.timestamps.push(now);
    }
}
