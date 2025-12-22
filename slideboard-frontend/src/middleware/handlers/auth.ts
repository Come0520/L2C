import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/config/env'
import { isPublicRoute } from '@/config/public-routes'

import { Middleware } from '../base'

/**
 * 认证中间件
 * 负责验证用户是否已登录，并处理未登录用户的重定向
 */
export class AuthMiddleware implements Middleware {
  /**
   * 执行中间件逻辑
   * @param request 请求对象
   * @param response 响应对象
   * @param next 下一个中间件函数
   */
  async execute(request: NextRequest, _response: NextResponse, next: () => Promise<void>): Promise<NextResponse | void> {
    const pathname = request.nextUrl.pathname

    // 将旧的 /auth/login 重定向到新的 /login
    // 匹配 /auth/login 或 /xx-XX/auth/login
    if (pathname === '/auth/login' || pathname.match(/^\/[a-z]{2}-[A-Z]{2}\/auth\/login$/)) {
      const url = request.nextUrl.clone()
      // 将路径中的 /auth/login 替换为 /login
      // 例如 /auth/login -> /login, /zh-CN/auth/login -> /zh-CN/login
      url.pathname = pathname.replace(/\/auth\/login$/, '/login')
      return NextResponse.redirect(url)
    }

    // 如果是公共路由，跳过认证检查
    // 但如果是登录页，我们仍需检查是否已登录以便跳转
    if (isPublicRoute(pathname) && !pathname.startsWith('/login') && !pathname.match(/^\/[a-z]{2}-[A-Z]{2}\/login/)) {
      return next()
    }

    // 检查用户是否已登录
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // AuthMiddleware 只需要验证，不需要写入 Cookie
            // Cookie 刷新由链条前面的 SessionRefreshMiddleware 处理
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 如果未登录，重定向到登录页
    if (!user) {
      // 如果当前已经在登录页，则不进行重定向，防止无限循环
      if (pathname.startsWith('/login') || pathname.match(/^\/[a-z]{2}-[A-Z]{2}\/login/)) {
        return next()
      }

      // 使用相对路径构建登录URL，保持locale前缀（如果存在）
      const url = request.nextUrl.clone()

      // 检查当前路径是否有locale前缀
      const localeMatch = pathname.match(/^\/([a-z]{2}-[A-Z]{2})/)
      const loginPath = localeMatch ? `/${localeMatch[1]}/login` : '/login'

      url.pathname = loginPath
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    // 如果用户已登录，允许继续处理
    // 另外，如果用户已登录且访问登录页，重定向到首页
    if (user && (pathname.startsWith('/login') || pathname.match(/^\/[a-z]{2}-[A-Z]{2}\/login/))) {
      const url = request.nextUrl.clone()

      const localeMatch = pathname.match(/^\/([a-z]{2}-[A-Z]{2})/)
      url.pathname = localeMatch ? `/${localeMatch[1]}` : '/'

      // 如果有 redirectTo 参数，使用它
      const redirectTo = url.searchParams.get('redirectTo')
      if (redirectTo) {
        url.pathname = redirectTo
        url.searchParams.delete('redirectTo')
      }
      return NextResponse.redirect(url)
    }

    return next()
  }
}
