/**
 * 移动端 API 速率限制中间件 (内存版)
 * 
 * 适配 Next.js Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/shared/lib/api-response';

interface RateLimitConfig {
    windowMs: number;     // 时间窗口（毫秒）
    maxAttempts: number;  // 最大尝试次数
    message?: string;     // 错误消息
}

// 内存存储：Key -> { count, resetTime }
const store = new Map<string, { count: number; resetTime: number }>();

interface RouteHandlerContext {
    params: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 简单的速率限制高阶函数
 */
export function withRateLimit<Context = RouteHandlerContext>(
    handler: (request: NextRequest, context: Context) => Promise<NextResponse>,
    config: RateLimitConfig,
    keyGenerator: (req: NextRequest) => string
) {
    return async (request: NextRequest, context: Context) => {
        const key = keyGenerator(request);
        const now = Date.now();

        // [开发/测试模式] 支持通过 X-API-Test-Bypass 头绕过限流，需匹配 AUTH_SECRET
        const bypassHeader = request.headers.get('x-api-test-bypass');
        if (process.env.NODE_ENV !== 'production' && bypassHeader && bypassHeader === process.env.AUTH_SECRET) {
            return await handler(request, context);
        }

        // 清理过期的记录
        const existingEntry = store.get(key);
        if (existingEntry && now > existingEntry.resetTime) {
            store.delete(key);
        }

        const entry = store.get(key) || { count: 0, resetTime: now + config.windowMs };

        if (entry.count >= config.maxAttempts) {
            const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
            const response = apiError(
                config.message || '请求过于频繁，请稍后再试',
                429
            );
            // 添加标准 Retry-After 头
            response.headers.set('Retry-After', retryAfter.toString());
            return response;
        }

        // 增加计数
        entry.count++;
        store.set(key, entry);

        // 执行原始 Handler
        const response = await handler(request, context);

        // 可选：将限流信息放入响应头
        response.headers.set('X-RateLimit-Limit', config.maxAttempts.toString());
        response.headers.set('X-RateLimit-Remaining', (config.maxAttempts - entry.count).toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());

        return response;
    };
}

/**
 * 通用 Key 生成器：IP + 自定义前缀
 */
export const getRateLimitKey = (prefix: string) => (req: NextRequest) => {
    // 获取 IP，尝试从头部获取
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    return `rl:${prefix}:${ip}`;
};
