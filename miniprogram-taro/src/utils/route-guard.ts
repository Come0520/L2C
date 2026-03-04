/**
 * 路由守卫工具
 *
 * @description 提供认证和角色两级权限校验。
 */
import Taro from '@tarojs/taro'
import { useAuthStore, ROLE_HOME, type UserRole } from '@/stores/auth'

/** 不需要登录即可访问的页面白名单 */
const PUBLIC_PAGES = [
    '/pages/landing/index',
    '/pages/landing/booking/index',
    '/pages/login/index',
    '/pages/register/index',
    '/pages/status/index',
    '/packageSales/invite/index',
]

/**
 * 检查是否为公开页面
 */
export function isPublicPage(path: string): boolean {
    return PUBLIC_PAGES.some(p => path.startsWith(p))
}

/**
 * 认证守卫 — 确保用户已登录
 *
 * @returns true 表示已通过守卫，可继续执行
 */
export function requireAuth(): boolean {
    const { isLoggedIn } = useAuthStore.getState()
    if (!isLoggedIn) {
        Taro.redirectTo({ url: '/pages/login/index' })
        return false
    }
    return true
}

/**
 * 角色守卫 — 确保当前角色有权访问
 *
 * @param allowedRoles - 允许访问的角色列表
 * @returns true 表示已通过守卫
 */
export function requireRole(allowedRoles: UserRole[]): boolean {
    if (!requireAuth()) return false

    const { currentRole } = useAuthStore.getState()
    if (!allowedRoles.includes(currentRole)) {
        // 跳转到该角色的默认首页
        const home = ROLE_HOME[currentRole] || '/pages/login/index'
        Taro.switchTab({ url: home }).catch(() => {
            Taro.redirectTo({ url: home })
        })
        return false
    }
    return true
}
