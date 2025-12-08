import { NextRequest, NextResponse } from 'next/server';

import { BaseMiddleware } from './base';

/**
 * CORS 中间件
 * 处理跨域资源共享
 */
export class CorsMiddleware extends BaseMiddleware {
  private readonly allowedOrigins: string[];
  private readonly allowedMethods: string[];
  private readonly allowedHeaders: string[];
  private readonly allowCredentials: boolean;

  constructor(
    options: {
      allowedOrigins?: string[];
      allowedMethods?: string[];
      allowedHeaders?: string[];
      allowCredentials?: boolean;
    } = {}
  ) {
    super();
    this.allowedOrigins = options.allowedOrigins || ['*'];
    this.allowedMethods = options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    this.allowedHeaders = options.allowedHeaders || ['Content-Type', 'Authorization'];
    this.allowCredentials = options.allowCredentials || true;
  }

  async execute(request: NextRequest, response: NextResponse, next: () => Promise<void>): Promise<void> {
    const origin = request.headers.get('Origin') || undefined;
    
    // 设置 CORS 头
    this.setCorsHeaders(response, origin);
    
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      // 对于 OPTIONS 请求，直接返回 200 OK
      response.headers.set('Allow', this.allowedMethods.join(','));
      return;
    }
    
    await next();
  }

  /**
   * 设置 CORS 头
   */
  private setCorsHeaders(response: NextResponse, origin?: string): void {
    // 设置允许的源
    if (origin && (this.allowedOrigins.includes('*') || this.allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (this.allowedOrigins.includes('*')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    // 设置其他 CORS 头
    response.headers.set('Access-Control-Allow-Methods', this.allowedMethods.join(','));
    response.headers.set('Access-Control-Allow-Headers', this.allowedHeaders.join(','));
    
    if (this.allowCredentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }
}
