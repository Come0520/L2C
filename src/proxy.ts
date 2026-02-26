
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';
import { extractAndVerifyToken } from '@/shared/lib/jwt';

// ============================================================================
// 常量配置
// ============================================================================

/**
 * 公开路由白名单（无需认证）
 * 这些路由将跳过 JWT 验证
 */
const PUBLIC_PATH_PREFIXES = [
  '/api/auth', // NextAuth.js 认证端点
  '/api/webhooks', // Webhook 端点（使用独立签名验证）
  '/api/health', // 健康检查
  '/api/public', // 公开 API
  '/api/mobile/auth/login', // 移动端登录
] as const;

/**
 * 未绑定租户的标识符
 */
const UNBOUND_TENANT_ID = '__UNBOUND__';

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 检查路径是否为公开路由
 * @param pathname - 请求路径
 * @returns 是否为公开路由
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * 创建未授权响应
 * @param message - 错误消息
 * @returns JSON 响应
 */
function createUnauthorizedResponse(message: string): NextResponse {
  return NextResponse.json({ error: 'Unauthorized', message }, { status: 401 });
}

/**
 * 创建禁止访问响应
 * @param message - 错误消息
 * @returns JSON 响应
 */
function createForbiddenResponse(message: string): NextResponse {
  return NextResponse.json({ error: 'TenantRequired', message }, { status: 403 });
}

/**
 * 创建带有用户上下文的请求头
 * @param request - 原始请求
 * @param token - JWT Token
 * @returns 增强后的请求头
 */
function createEnrichedHeaders(request: NextRequest, token: JWT): Headers {
  const headers = new Headers(request.headers);

  // 注入用户上下文信息到请求头
  // 类型安全：JWT 接口已在 next-auth.d.ts 中扩展
  headers.set('x-user-id', token.sub ?? '');
  headers.set('x-tenant-id', String(token.tenantId ?? ''));
  headers.set('x-user-role', String(token.role ?? 'USER'));

  return headers;
}

// ============================================================================
// Proxy 主函数
// ============================================================================

/**
 * Next.js Proxy - API 路由认证与租户隔离
 *
 * 功能：
 * 1. JWT Token 验证（Edge Runtime 兼容）
 * 2. 租户隔离检查
 * 3. 用户上下文注入到请求头
 *
 * @param request - 传入的 HTTP 请求
 * @returns NextResponse - 处理后的响应
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ========================================
  // 0. 页面路由分流：已登录用户访问落地页 → 自动跳转工作台
  // ========================================
  if (pathname === '/') {
    const sessionToken = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // 未登录用户：放行到 (marketing) 落地页
    return NextResponse.next();
  }

  // ========================================
  // 1. 页面路由认证守卫：未登录用户访问受保护路由 → 重定向到 Landing Page
  // ========================================
  if (!pathname.startsWith('/api')) {
    // 页面路由中的公开路径白名单（无需登录即可访问）
    const publicPagePaths = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/unbound',
    ];

    const isPublicPage = publicPagePaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    );

    // 公开页面路由：直接放行
    if (isPublicPage) {
      return NextResponse.next();
    }

    // 受保护页面路由：检查登录状态
    const pageToken = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    // 未登录 → 重定向到 Landing Page
    if (!pageToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 已登录 → 放行
    return NextResponse.next();
  }

  // 2. 公开 API 路由直接放行
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 2. 验证 JWT Token (Web Auth)
  let token = (await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  })) as JWT | null;

  // 2.1 尝试验证移动端自定义 Token (Mobile Auth Fallback)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    const mobilePayload = await extractAndVerifyToken(authHeader);

    if (mobilePayload) {
      token = {
        sub: mobilePayload.userId,
        tenantId: mobilePayload.tenantId,
        role: mobilePayload.role,
        name: mobilePayload.phone,
        email: `${mobilePayload.phone}@mobile.local`,
      } as unknown as JWT;
    }
  }

  if (!token) {
    return createUnauthorizedResponse('请先登录');
  }

  // 3. 验证租户绑定
  const { tenantId } = token;
  if (!tenantId || tenantId === UNBOUND_TENANT_ID) {
    return createForbiddenResponse('用户未绑定租户');
  }

  // 4. 注入用户上下文并放行请求
  const enrichedHeaders = createEnrichedHeaders(request, token);

  return NextResponse.next({
    request: {
      headers: enrichedHeaders,
    },
  });
}

// ============================================================================
// Proxy 配置
// ============================================================================

/**
 * Proxy 路由匹配配置
 *
 * 注意：
 * - matcher 值必须是常量，不能使用动态变量
 * - 使用负向前瞻排除不需要处理的路径
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  matcher: [
    // 匹配根路径（用于落地页分流）
    '/',
    // 匹配所有 /api 路由（排除公开端点）
    '/api/((?!auth|webhooks|health|public|miniprogram).*)',
    // 匹配受保护的页面路由（未登录用户将被重定向到 Landing Page）
    '/dashboard/:path*',
    '/after-sales/:path*',
    '/analytics/:path*',
    '/channels/:path*',
    '/customers/:path*',
    '/finance/:path*',
    '/leads/:path*',
    '/notifications/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/projects/:path*',
    '/quote-bundles/:path*',
    '/quotes/:path*',
    '/service/:path*',
    '/settings/:path*',
    '/showroom/:path*',
    '/supply-chain/:path*',
    '/workbench/:path*',
    '/workflow/:path*',
  ],
};
