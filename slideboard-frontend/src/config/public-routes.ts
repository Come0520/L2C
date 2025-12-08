// 统一的公共路由配置
// 这些路由不需要权限验证或认证

export const PUBLIC_ROUTES = [
  // 基础路由
  '/',
  '/login',
  '/register',
  
  // 认证相关路由
  '/auth/*',
  
  // API 路由
  '/api/*',
  
  // Next.js 内部路由
  '/_next/*',
  
  // 静态资源
  '/favicon.ico',
  '/robots.txt',
  
  // 开发相关路由
  '/_playground/*'
]

// 在端到端测试模式下，放宽受限页面以便进行无登录渲染验证
if (process.env.E2E_TEST === '1') {
  PUBLIC_ROUTES.push(
    '/orders',
    '/orders/*',
    '/dashboard',
    '/notifications'
  )
}

/**
 * 检查路由是否为公共路由
 * @param pathname 路由路径
 * @returns 是否为公共路由
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/*')) {
      const prefix = route.slice(0, -2)
      return pathname.startsWith(prefix)
    }
    return pathname === route
  })
}
