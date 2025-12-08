import { NextRequest, NextResponse } from 'next/server';

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
      console.error(`[ERROR] ${method} ${url} 500 (${duration}ms)`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
