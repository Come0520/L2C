import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('api/timing');

/**
 * 计时中间件：记录请求处理时长并设置 X-Response-Time 响应头
 * 
 * @param handler 原始路由处理器
 * @returns 包装后的处理器
 */
export function withTiming(handler: (request: NextRequest, context?: unknown) => Promise<Response>) {
    return async function (request: NextRequest, context?: unknown) {
        const start = performance.now();

        try {
            const response = await handler(request, context);
            const duration = Math.round(performance.now() - start);

            // 设置响应头 (注意：对于不可变响应可能会失败，但 NextResponse.json 是可变的)
            try {
                response.headers.set('X-Response-Time', `${duration}ms`);
            } catch (_e) {
                // 如果 headers 不可变，静默忽略或记录
                log.warn('无法设置 X-Response-Time 响应头，响应可能已冻结', { path: request.nextUrl.pathname });
            }

            // 慢请求记录 (阈值暂定 500ms)
            if (duration > 500) {
                log.warn(`慢请求检测: ${request.method} ${request.nextUrl.pathname} 耗时 ${duration}ms`, {
                    method: request.method,
                    path: request.nextUrl.pathname,
                    duration: `${duration}ms`,
                    statusCode: response.status
                });
            }

            return response;
        } catch (error) {
            const duration = Math.round(performance.now() - start);
            log.error(`请求异常: ${request.method} ${request.nextUrl.pathname} 耗时 ${duration}ms`, {
                method: request.method,
                path: request.nextUrl.pathname,
                duration: `${duration}ms`
            }, error);
            throw error;
        }
    };
}
