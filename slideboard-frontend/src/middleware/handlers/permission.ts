import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { env } from '@/config/env'
import { isPublicRoute } from '@/config/public-routes'
import { ROUTE_REQUIRED_PERMISSIONS, ROUTE_REQUIRED_ROLES } from '@/config/route-access'
import { isAdmin, isServiceRole, isFinance, isSalesRole, hasPermission } from '@/utils/permissions'

import { Middleware } from '../base'

/**
 * 权限验证中间件
 * 负责验证用户是否具有访问特定路由的权限
 */
export class PermissionMiddleware implements Middleware {
  /**
   * 执行中间件逻辑
   * @param request 请求对象
   * @param response 响应对象
   * @param next 下一个中间件函数
   */
  async execute(request: NextRequest, _response: NextResponse, next: () => Promise<void>): Promise<NextResponse | void> {
    const pathname = request.nextUrl.pathname

    // 如果是公共路由，跳过权限检查
    if (isPublicRoute(pathname)) {
      return next()
    }

    // 获取用户信息和角色
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // PermissionMiddleware 只需要读取，不需要写入 Cookie
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 如果用户未登录，跳过权限检查（认证中间件会处理）
    if (!user) {
      return next()
    }

    // 获取用户角色
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role ?? 'user'

    // 检查用户是否具有访问路由的权限
    if (!this.hasRoutePermission(role, pathname)) {
      const forbiddenUrl = new URL('/403', request.url)
      return NextResponse.redirect(forbiddenUrl)
    }

    // 如果权限验证通过，允许继续处理
    return next()
  }

  /**
   * 检查用户是否具有访问路由的权限
   * @param userRole 用户角色
   * @param pathname 路由路径
   * @returns 是否具有权限
   */
  private hasRoutePermission(userRole: string, pathname: string): boolean {
    // 管理员角色具有所有权限
    if (isAdmin(userRole as any)) {
      return true
    }

    // 检查路由角色要求
    for (const [route, roles] of Object.entries(ROUTE_REQUIRED_ROLES)) {
      const routePattern = new RegExp(`^${route.replace(/\[\w+\]/g, '[^/]+')}$`)
      if (routePattern.test(pathname)) {
        // 特殊路由权限检查
        if (pathname.startsWith('/service-supply/surveyors')) {
          if (!isServiceRole(userRole as any)) {
            return false
          }
        }

        if (pathname.startsWith('/finance')) {
          if (!(isFinance(userRole as any) || isAdmin(userRole as any))) {
            return false
          }
        }

        if (pathname.startsWith('/quotes') || pathname.startsWith('/orders') || pathname.startsWith('/leads')) {
          if (!(isSalesRole(userRole as any) || roles.includes(userRole as any))) {
            return false
          }
        }

        if (!hasPermission(userRole as any, roles)) {
          return false
        }
      }
    }

    // 检查路由权限要求
    for (const [route, required] of Object.entries(ROUTE_REQUIRED_PERMISSIONS)) {
      const routePattern = new RegExp(`^${route.replace(/\[\w+\]/g, '[^/]+')}$`)
      if (routePattern.test(pathname)) {
        // 特殊路由权限检查
        if (pathname.startsWith('/service-supply/surveyors')) {
          if (!isServiceRole(userRole as any)) {
            return false
          }
        }

        // 检查用户是否具有所需权限
        const userPermissions = this.getUserPermissions(userRole)
        if (userPermissions.includes('all')) {
          return true
        }

        return required.every(p => userPermissions.includes(p))
      }
    }

    // 默认允许访问
    return true
  }

  /**
   * 获取用户权限列表
   * @param userRole 用户角色
   * @returns 用户权限列表
   */
  private getUserPermissions(userRole: string): string[] {
    // 这里应该调用实际的权限获取函数，暂时简化实现
    const { getPermissionsByRole } = require('@/utils/permissions')
    return getPermissionsByRole(userRole as any)
  }
}
