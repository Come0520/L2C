import { NextRequest, NextResponse } from 'next/server';

import { BaseMiddleware } from './base';

/**
 * 安全头中间件
 * 负责设置各种安全相关的HTTP头
 * 注意：部分安全头已在 next.config.js 中配置，这里只补充必要的安全头
 */
export class SecurityHeadersMiddleware extends BaseMiddleware {
  async execute(_request: NextRequest, response: NextResponse, next: () => Promise<void>): Promise<void> {
    // 注意：主要安全头已在 next.config.js 中配置
    // 这里只添加一些额外的安全头或确保一致性
    
    // X-XSS-Protection (已在 next.config.js 中配置，这里重复设置以确保兼容性)
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // 其他可能需要的安全头可以在这里添加
    
    await next();
  }
}
