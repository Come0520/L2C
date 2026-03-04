import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';
import { extractAndVerifyToken } from '@/shared/lib/jwt';
import { createLogger } from '@/shared/lib/logger';

/** 认证代理专用日志记录器，用于安全事件追溯 */
const log = createLogger('proxy:auth');

// ============================================================================
// 常量配置
// ============================================================================

/**
 * 公开路由白名单（无需 Web JWT 认证，直接放行）
 *
 * 注意：新 Matcher 采用排除法，覆盖所有路由（含 /api/miniprogram）。
 * 小程序 API 使用独立的 withMiniprogramAuth 认证体系，
 * 因此整个 /api/miniprogram 路由组在此处放行，不走 Web JWT 验证。
 */
const PUBLIC_PATH_PREFIXES = [
  '/api/auth', // NextAuth.js 认证端点
  '/api/webhooks', // Webhook 端点（使用独立签名验证）
  '/api/health', // 健康检查
  '/api/public', // 公开 API
  '/api/mobile/auth/login', // 移动端登录
  '/api/miniprogram', // 小程序 API（使用独立 withMiniprogramAuth 认证体系）
] as const;

// 注：已移除「每日首次必看」Cookie 策略。
// 新策略：每次打开网页都展示落地页，已登录用户可直接点击「进入工作台」。

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
 * 提取 getToken 的安全配置（针对 HTTPS/代理环境）
 * @param request - 原始请求
 */
function getSecureTokenOptions(request: NextRequest) {
  const isSecure =
    process.env.NODE_ENV === 'production' ||
    request.url.startsWith('https://') ||
    request.headers.get('x-forwarded-proto') === 'https';

  return {
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecure,
    salt: isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token',
  };
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
  // 0. 页面路由分流：落地页「每次必看」策略
  //    - 无论登录状态和访问历史，始终展示落地页
  //    - 已登录用户：页面上显示「进入工作台」按钮，点击即可进入
  //    - 未登录用户：页面上显示「登录」/「注册」入口
  // ========================================
  if (pathname === '/') {
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
    const pageToken = await getToken(getSecureTokenOptions(request));

    // 未登录 → 重定向到登录页
    if (!pageToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 已登录 → 放行
    return NextResponse.next();
  }

  // 2. 公开 API 路由直接放行
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 2. 验证 JWT Token (Web Auth)
  let token = (await getToken(getSecureTokenOptions(request))) as JWT | null;

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
    log.warn('[Auth] API 请求未携带有效 Token', {
      pathname,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    return createUnauthorizedResponse('请先登录');
  }

  // 3. 验证租户绑定与超管隔离
  const { tenantId, isPlatformAdmin } = token;

  // 超管防串入业务路由
  if (tenantId === '__PLATFORM__' || isPlatformAdmin) {
    if (
      pathname.startsWith('/api') &&
      !pathname.startsWith('/api/admin') &&
      !pathname.startsWith('/api/user')
    ) {
      // 超管不能访问非 admin/user 的常规后台 API，给出禁止
      return createForbiddenResponse('超级管理员无法调用业务 API');
    }
    if (
      !pathname.startsWith('/api') &&
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/profile')
    ) {
      // 访问普通业务页面跳转到 admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // 放行超管对 /admin 路由和 /api/admin 路由的访问
    const enrichedHeaders = createEnrichedHeaders(request, token);
    return NextResponse.next({ request: { headers: enrichedHeaders } });
  }

  // 常规用户验证租户绑定
  if (!tenantId || tenantId === UNBOUND_TENANT_ID) {
    log.warn('[Auth] 用户未绑定企业，拒绝访问', {
      userId: token.sub,
      pathname,
      tenantId: tenantId || 'null',
    });
    return createForbiddenResponse('用户未绑定企业');
  }

  // 常规用户防串入超管路由
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return createForbiddenResponse('非超级管理员无法访问平台管理中心');
  }

  // 4. 注入用户上下文并放行请求
  const enrichedHeaders = createEnrichedHeaders(request, token);

  return NextResponse.next({
    request: {
      headers: enrichedHeaders,
    },
  });
}

/**
 * Proxy 路由匹配配置
 *
 * 策略：排除法（Exclusion Pattern）
 * - 匹配所有路由，仅排除 Next.js 静态资源、图片优化路由和静态文件
 * - 优势：新增任何业务页面/API 都自动纳入 proxy 保护范围，无需手动维护白名单
 * - 代价：每个请求都会经过 proxy 判断（Edge Runtime 开销极小）
 *
 * 公开路由的放行逻辑已在 proxy 函数体内部通过 publicPagePaths / isPublicPath 实现。
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，但排除以下路径：
     * - _next/static  静态文件（JS/CSS bundle）
     * - _next/image   Image Optimization API
     * - favicon.ico   网站图标
     * - 常见静态资产后缀（svg / png / jpg / jpeg / gif / webp / ico）
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
