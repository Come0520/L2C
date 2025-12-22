import { NextRequest, NextResponse } from 'next/server';

import { sendSystemAlert } from '@/lib/notifications/feishu-notify';

import { BaseMiddleware } from './base';

/**
 * 请求日志中间件
 * 记录请求信息
 */
export class RequestLoggingMiddleware extends BaseMiddleware {
  async execute(request: NextRequest, response: NextResponse, next: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    const { method, url, headers } = request;

    // 记录请求开始
    console.log(`[REQUEST] ${method} ${url}`, {
      userAgent: headers.get('user-agent'),
      ip: headers.get('x-forwarded-for') || headers.get('remote-addr'),
      timestamp: new Date().toISOString(),
    });

    try {
      await next();

      // 记录请求结束
      const duration = Date.now() - startTime;
      console.log(`[RESPONSE] ${method} ${url} ${response.status} (${duration}ms)`);
    } catch (error) {
      // 记录错误
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`[ERROR] ${method} ${url} 500 (${duration}ms)`, {
        error: errorMessage,
        stack: errorStack,
      });

      // 发送飞书系统告警
      // 注意：这里不使用 await，避免阻塞请求响应，但在 Edge Runtime 中可能需要 waitUntil
      // 由于 Next.js Middleware 的限制，我们这里尽力发送
      try {
        await sendSystemAlert({
          type: 'api',
          title: 'Middleware Exception',
          message: `Request failed: ${method} ${url}\nError: ${errorMessage}`,
          metric: `${duration}ms`,
        });
      } catch (alertError) {
        console.error('[Middleware] Failed to send alert:', alertError);
      }

      throw error;
    }
  }
}

