/**
 * 通用速率限制 (Rate Limiting) 中间件
 * 
 * 功能：
 * 1. 按 IP 或 Token 限制请求频率
 * 2. 支持不同 API 端点的差异化限流
 * 3. 返回标准 Rate Limit Headers
 */

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
}

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
    /** 当前请求数 */
    current: number;
    /** 最大请求数 */
    limit: number;
}

// ============================================================
// 预设配置
// ============================================================

/**
 * 常用 API 限流配置
 */
export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
    // 登录接口：防止暴力破解
    login: { max: 5, windowMs: 60 * 1000, keyType: 'ip' },         // 5次/分钟

    // 短信验证码：防止滥用
    sms: { max: 3, windowMs: 60 * 1000, keyType: 'ip' },           // 3次/分钟

    // 刷新 Token
    refresh: { max: 10, windowMs: 60 * 1000, keyType: 'token' },   // 10次/分钟

    // Webhook 接口
    webhook: { max: 100, windowMs: 60 * 1000, keyType: 'token' },  // 100次/分钟

    // 普通 API（已认证用户）
    api: { max: 60, windowMs: 60 * 1000, keyType: 'user' },        // 60次/分钟

    // 上传接口
    upload: { max: 10, windowMs: 60 * 1000, keyType: 'user' },     // 10次/分钟
};

// ============================================================
// 限流存储
// ============================================================

/**
 * 内存限流存储
 * 注意：生产环境多实例部署时应使用 Redis
 */
class RateLimitStore {
    private store = new Map<string, { count: number; resetAt: number }>();

    /**
     * 清理过期记录（定期调用）
     */
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.store.entries()) {
            if (now > value.resetAt) {
                this.store.delete(key);
            }
        }
    }

    /**
     * 检查并增加计数
     */
    check(key: string, config: RateLimitConfig): RateLimitResult {
        const now = Date.now();
        let record = this.store.get(key);

        // 重置过期记录
        if (!record || now > record.resetAt) {
            record = { count: 0, resetAt: now + config.windowMs };
            this.store.set(key, record);
        }

        record.count++;

        return {
            allowed: record.count <= config.max,
            remaining: Math.max(0, config.max - record.count),
            resetAt: new Date(record.resetAt),
            current: record.count,
            limit: config.max,
        };
    }
}

// 全局限流存储实例
const rateLimitStore = new RateLimitStore();

// 每 5 分钟清理一次过期记录
if (typeof setInterval !== 'undefined') {
    setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);
}

// ============================================================
// 中间件函数
// ============================================================

/**
 * 检查速率限制
 * 
 * @param key - 限流标识符（IP、Token 或 UserId）
 * @param preset - 预设配置名称或自定义配置
 * @returns 限流检查结果
 * 
 * @example
 * ```typescript
 * // 在 API Route 中使用
 * const ip = request.headers.get('x-forwarded-for') || 'unknown';
 * const result = checkRateLimit(ip, 'login');
 * if (!result.allowed) {
 *     return new Response('Too Many Requests', { status: 429 });
 * }
 * ```
 */
export function checkRateLimit(
    key: string,
    preset: keyof typeof RATE_LIMIT_PRESETS | RateLimitConfig
): RateLimitResult {
    const config = typeof preset === 'string'
        ? RATE_LIMIT_PRESETS[preset]
        : preset;

    if (!config) {
        throw new Error(`Unknown rate limit preset: ${preset}`);
    }

    return rateLimitStore.check(key, config);
}

/**
 * 生成标准 Rate Limit 响应头
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
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
