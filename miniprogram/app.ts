/**
 * L2C 微信小程序入口
 */
import { authStore } from './stores/auth-store';
import { errorReporter } from './utils/error-reporter';

// 后端 API 基础地址
const API_BASE = 'http://localhost:3000/api/miniprogram'; // Local Development

// 定义全局 App 实例的类型接口
export interface IAppOption {
    globalData: {
        apiBase: string;
        baseUrl: string;
        userInfo?: any;
    };
    userInfoReadyCallback?: (res: any) => void;
    wxLogin: () => Promise<{ success: boolean; openId?: string; error?: string }>;
    request: (path: string, data?: any, method?: string) => Promise<any>;
}

App<IAppOption>({
    globalData: {
        apiBase: API_BASE,
        baseUrl: API_BASE.replace('/api/miniprogram', ''),
    },

    onLaunch(options: any) {
        console.log('L2C 小程序启动', options);
        // 初始化错误上报
        errorReporter.init();

        // 监听页面不存在 (404 监控)
        wx.onPageNotFound?.((res) => {
            errorReporter.report({
                message: `页面不存在: ${res.path}`,
                type: 'JS_ERROR',
                timestamp: Date.now(),
                metadata: res
            });
            wx.switchTab({ url: '/pages/index/index' }); // 回退机制
        });

        // 监听内存告警
        wx.onMemoryWarning?.((res) => {
            errorReporter.report({
                message: `内存不足告警: 级别 ${res.level}`,
                type: 'WX_ERROR',
                timestamp: Date.now(),
                metadata: res
            });
        });
    },

    async wxLogin(): Promise<{ success: boolean; openId?: string; error?: string }> {
        return new Promise((resolve) => {
            wx.login({
                success: async (res) => {
                    if (res.code) {
                        try {
                            const result = await this.request('/auth/wx-login', { code: res.code }, 'POST');

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
    async request(path: string, data: any = {}, method: string = 'GET'): Promise<any> {
        return new Promise((resolve, reject) => {
            wx.request({
                url: `${this.globalData.apiBase}${path}`,
                method: method as any,
                data,
                header: {
                    'Authorization': authStore.token ? `Bearer ${authStore.token}` : ''
                },
                success: (res) => {
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
                        return;
                    }

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(res.data);
                    } else {
                        // 自动上报 API 错误
                        errorReporter.report({
                            message: `接口请求返回状态码异常: ${res.statusCode}`,
                            type: 'API_ERROR',
                            timestamp: Date.now(),
                            metadata: { path, statusCode: res.statusCode }
                        });
                        reject({ success: false, error: `请求失败: ${res.statusCode}`, data: res.data });
                    }
                },
                fail: (err) => {
                    console.error('[Request] Fail:', err);
                    errorReporter.report({
                        message: err.errMsg || 'Network Failure',
                        type: 'API_ERROR',
                        timestamp: Date.now(),
                        metadata: { path, method }
                    });
                    reject({ success: false, error: '网络请求失败', errMsg: err.errMsg });
                }
            });
        });
    }
});

export { };
