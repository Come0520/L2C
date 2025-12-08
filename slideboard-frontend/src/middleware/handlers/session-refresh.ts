import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/config/env'

import { Middleware } from '../base'

/**
 * 会话刷新中间件
 * 负责更新用户会话和处理 Supabase 认证 cookie
 */
export class SessionRefreshMiddleware implements Middleware {
  /**
   * 执行中间件逻辑
   * @param request 请求对象
   * @param response 响应对象
   * @param next 下一个中间件函数
   */
  async execute(request: NextRequest, response: NextResponse, next: () => Promise<void>): Promise<NextResponse | void> {
    // 创建 Supabase 客户端
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )

            // 直接在传入的响应对象上设置 cookies，并确保安全属性
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              })
            )
          },
        },
      }
    )

    // 更新用户会话
    // 这会触发 setAll 回调，从而更新 request 和 response 的 cookies
    await supabase.auth.getUser()

    // 继续执行下一个中间件
    await next()
  }
}
