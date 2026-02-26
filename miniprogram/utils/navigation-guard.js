import { authStore } from '../stores/auth-store';
import { logger } from './logger';
/**
 * 导航守卫与统一导航工具
 */
export class NavigationGuard {
    /**
     * 统一跳转方法
     */
    static navigateTo(url) {
        const path = url.split('?')[0].replace(/^\//, '');
        // 权限检查
        if (!this.canAccess(path)) {
            logger.warn('NavigationGuard', `无权访问页面: ${path}，重定向至 landing`);
            wx.reLaunch({ url: '/pages/landing/landing' });
            return;
        }
        logger.info('NavigationGuard', `跳转至: ${url}`);
        wx.navigateTo({ url });
    }
    /**
     * 权限检查逻辑
     */
    static canAccess(path) {
        // 公开页面直接放行
        if (this.publicPages.includes(path))
            return true;
        // 已登录放行
        return authStore.isLoggedIn;
    }
    /**
     * 返回上一页并执行回调（如果有）
     */
    static back(delta = 1) {
        wx.navigateBack({ delta });
    }
}
NavigationGuard.publicPages = [
    'pages/landing/landing',
    'pages/login/login',
    'pages/register/register'
];
