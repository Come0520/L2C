import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/config/env'
import { isPublicRoute } from '@/config/public-routes'
import { createClient } from '@/lib/supabase/server'

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

    // 如果是公共路由，跳过认证检查
    if (isPublicRoute(pathname)) {
      return next()
    }

    // 检查用户是否已登录
    // DEVELOPMENT ONLY: Bypass auth check if explicitly requested via env or constant
    // For now, we will bypass auth check for development convenience as requested
    if (env.NODE_ENV === 'development') {
       return next()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 如果未登录，重定向到登录页
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 如果用户已登录，允许继续处理
    return next()
  }
}
