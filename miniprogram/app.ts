/**
 * L2C 微信小程序入口
 */

// 后端 API 基础地址
const API_BASE = 'https://luolai-sd.xin/api/miniprogram';

App({
    globalData: {
        userInfo: null,
        openId: null,
        tenantId: null,
        tenantStatus: null, // pending_approval | active | rejected
        isLoggedIn: false,
        apiBase: API_BASE,
    },

    onLaunch() {
        console.log('L2C 小程序启动');

        // 检查登录状态
        this.checkLoginStatus();
    },

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        const token = wx.getStorageSync('token');
        const userInfo = wx.getStorageSync('userInfo');

        if (token && userInfo) {
            this.globalData.userInfo = userInfo;
            this.globalData.isLoggedIn = true;
            this.globalData.tenantId = userInfo.tenantId;
            this.globalData.tenantStatus = userInfo.tenantStatus;
        }
    },

    /**
     * 微信登录
     */
    async wxLogin(): Promise<{ success: boolean; openId?: string; error?: string }> {
        return new Promise((resolve) => {
            wx.login({
                success: async (res) => {
                    if (res.code) {
                        try {
                            // 发送 code 到后端换取 openId
                            const result = await this.request('/auth/wx-login', {
                                method: 'POST',
                                data: { code: res.code },
                            });

                            if (result.success) {
                                this.globalData.openId = result.data.openId;
                                wx.setStorageSync('openId', result.data.openId);

                                // 如果用户已绑定租户
                                if (result.data.user) {
                                    this.globalData.userInfo = result.data.user;
                                    this.globalData.tenantId = result.data.user.tenantId;
                                    this.globalData.tenantStatus = result.data.tenantStatus;
                                    this.globalData.isLoggedIn = true;
                                    wx.setStorageSync('userInfo', result.data.user);
                                    wx.setStorageSync('token', result.data.token);
                                }

                                resolve({ success: true, openId: result.data.openId });
                            } else {
                                resolve({ success: false, error: result.error });
                            }
                        } catch (error) {
                            console.error('登录失败:', error);
                            resolve({ success: false, error: '网络请求失败' });
                        }
                    } else {
                        resolve({ success: false, error: '获取登录凭证失败' });
                    }
                },
                fail: (err) => {
                    console.error('wx.login 失败:', err);
                    resolve({ success: false, error: '微信登录失败' });
                },
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
        const token = wx.getStorageSync('token');

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
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(res.data);
                    } else {
                        reject(res.data);
                    }
                },
                fail: reject,
            });
        });
    },

    /**
     * 退出登录
     */
    logout() {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        this.globalData.userInfo = null;
        this.globalData.tenantId = null;
        this.globalData.isLoggedIn = false;

        // 跳转到首页
        wx.reLaunch({ url: '/pages/index/index' });
    },
});
