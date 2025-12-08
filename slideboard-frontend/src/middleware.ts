import { NextRequest, NextResponse } from 'next/server';

import { MiddlewareChain } from './middleware/base';
import { CorsMiddleware } from './middleware/cors';
import { AuthMiddleware } from './middleware/handlers/auth';
import { intlMiddleware } from './middleware/handlers/intl';
import { PermissionMiddleware } from './middleware/handlers/permission';
import { RateLimitMiddleware } from './middleware/handlers/rate-limit';
import { SessionRefreshMiddleware } from './middleware/handlers/session-refresh';
import { RequestLoggingMiddleware } from './middleware/logging';
import { SecurityHeadersMiddleware } from './middleware/security';

/**
 * 中间件入口
 * 使用责任链模式管理多个中间件
 */
export async function middleware(request: NextRequest) {
  // 0. 国际化处理 (最高优先级，处理路由重写)
  // 排除 API 路由和静态资源
  const isApiOrStatic =
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.');

  let response = NextResponse.next();

  if (!isApiOrStatic) {
    const intlResponse = intlMiddleware(request);
    // 如果是重定向，直接返回
    if (intlResponse.status >= 300 && intlResponse.status < 400) {
      return intlResponse;
    }
    // 否则使用 intlResponse 作为基础响应（包含了重写头等）
    response = intlResponse;
  }

  // 创建中间件链
  const middlewareChain = new MiddlewareChain()
    .add(new SessionRefreshMiddleware()) // 1. 刷新会话 (最高优先级)
    .add(new RequestLoggingMiddleware()) // 2. 请求日志
    .add(new RateLimitMiddleware())      // 3. 速率限制 (新增)
    .add(new CorsMiddleware())           // 4. CORS 处理
    .add(new SecurityHeadersMiddleware())// 5. 安全响应头
    .add(new AuthMiddleware())           // 6. 认证检查
    .add(new PermissionMiddleware());    // 7. 权限验证

  // 执行中间件链
  return middlewareChain.execute(request, response);
}

// 中间件匹配配置
export const config = {
  matcher: [
    /*
     * 匹配所有路由，但排除：
     * 1. _next/static (静态文件)
     * 2. _next/image (图片优化)
     * 3. favicon.ico (图标)
     * 4. public 目录下的其他文件
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

