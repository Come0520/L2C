/**
 * L2C 微信小程序入口
 * Updated at: 2026-01-24T20:57:28+08:00
 */
import { authStore } from './stores/auth-store';

// 后端 API 基础地址
// const API_BASE = 'https://luolai-sd.xin/api/miniprogram'; // Production
// 后端 API 基础地址
// const API_BASE = 'https://luolai-sd.xin/api/miniprogram'; // Production
const API_BASE = 'http://localhost:3000/api/miniprogram'; // Local Development

App({
    // Keep globalData for legacy compatibility or simple sharing if needed
    globalData: {
        apiBase: API_BASE,
    },

    onLaunch(options: any) {
        console.log('L2C 小程序启动', options);
        // [Existing logic...]
    },
    // ... wxLogin logic ...
    async wxLogin(): Promise<{ success: boolean; openId?: string; error?: string }> {
        return new Promise((resolve) => {
            wx.login({
                success: async (res) => {
                    if (res.code) {
                        try {
                            const result = await this.request('/auth/wx-login', {
                                method: 'POST',
                                data: { code: res.code },
                            });

                            if (result.success) {
                                if (result.data.user) {
                                    authStore.setLogin(result.data.token, result.data.user);
                                }
                                resolve({ success: true, openId: result.data.openId });
                            } else {
                                resolve({ success: false, error: result.error });
                            }
                        } catch (error: any) {
                            console.error('登录失败:', error);
                            // Expose actual error message for debugging
                            const errMsg = error?.errMsg || error?.message || JSON.stringify(error);
                            resolve({ success: false, error: `请求异常: ${errMsg}` });
                        }
                    } else {
                        resolve({ success: false, error: '获取登录凭证失败' });
                    }
                },
                fail: (err) => {
                    console.error('wx.login 失败:', err);
                    resolve({ success: false, error: `微信登录失败: ${err.errMsg}` });
                }
            });
        });
    },

    /**
     * 封装请求方法
     */
    async request(
        path: string,
        options: { method?: string; data?: any } = {}
    ): Promise<any> {
        const token = authStore.token;

        return new Promise((resolve, reject) => {
            wx.request({
                url: `${API_BASE}${path}`,
                method: (options.method || 'GET') as any,
                data: options.data,
                header: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                success: (res: any) => {
                    if (res.statusCode === 401) {
                        console.warn('[Request] 401 Unauthorized, logging out...');
                        authStore.logout();

                        // 获取当前页面栈，如果在非 Public 页面则跳转登录
                        const pages = getCurrentPages();
                        const currentPage = pages[pages.length - 1];
                        if (currentPage && currentPage.route !== 'pages/landing/landing') {
                            wx.reLaunch({ url: '/pages/landing/landing' });
                        }

                        reject({ success: false, error: '未授权，请重新登录' });
                    } else if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(res.data);
                    } else {
                        reject(res.data);
                    }
                },
                fail: (err) => {
                    console.error('[Request] Fail:', err);
                    reject({ success: false, error: '网络请求失败' });
                },
            });
        });
    }
});
