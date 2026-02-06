import { authStore } from '../../stores/auth-store';

Page({
    data: {
        redirectUrl: ''
    },

    onLoad(options: any) {
        if (options && options.redirect) {
            this.setData({ redirectUrl: decodeURIComponent(options.redirect) });
        }
    },

    async onGetPhoneNumber(e: any) {
        if (e.detail.errMsg !== 'getPhoneNumber:ok') {
            wx.showToast({ title: '需要授权手机号才能登录', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '登录中...' });

        try {
            const app = getApp<IAppOption>();

            // 1. WeChat Login to get OpenID (session)
            const loginRes = await app.wxLogin();
            if (!loginRes.success) {
                throw new Error(loginRes.error || '微信登录失败');
            }

            // 2. Decrypt Phone & Auto Register/Login
            const res = await app.request('/auth/decrypt-phone', {
                method: 'POST',
                data: {
                    code: e.detail.code,
                    openId: loginRes.openId
                }
            });

            wx.hideLoading();

            if (res.success) {
                // Login Success
                authStore.setLogin(res.data.token, res.data.user);

                wx.showToast({ title: '登录成功' });

                // Redirect based on role
                const role = res.data.user.role;
                setTimeout(() => {
                    if (this.data.redirectUrl) {
                        wx.reLaunch({ url: this.data.redirectUrl });
                    } else {
                        // Role-based routing
                        switch (role) {
                            case 'admin':
                            case 'boss':
                            case 'sales':
                                wx.reLaunch({ url: '/pages/workbench/index' });
                                break;
                            case 'installer':
                                wx.reLaunch({ url: '/pages/tasks/index' });
                                break;
                            case 'customer':
                                wx.reLaunch({ url: '/pages/index/index' });
                                break;
                            default:
                                wx.reLaunch({ url: '/pages/index/index' });
                        }
                    }
                }, 500);

            } else {
                // Should not happen as decrypt-phone creates user if needed? 
                // actually my implementation returned USER_NOT_FOUND if phone not in DB?
                // Wait, reviewing previous step: "用户不存在 -> 返回 USER_NOT_FOUND" 
                // Ah, so we need to handle USER_NOT_FOUND by redirecting to register with phone filled.

                if (res.code === 'USER_NOT_FOUND') {
                    const phone = res.data?.phone;
                    wx.showModal({
                        title: '提示',
                        content: '您的手机号尚未注册企业账户，是否前往注册？',
                        success: (modalRes) => {
                            if (modalRes.confirm) {
                                wx.navigateTo({
                                    url: `/pages/register/register?phone=${phone}` + (this.data.redirectUrl ? `&redirect=${encodeURIComponent(this.data.redirectUrl)}` : '')
                                });
                            }
                        }
                    });
                } else {
                    throw new Error(res.error || '登录失败');
                }
            }

        } catch (error: any) {
            wx.hideLoading();
            console.error(error);
            wx.showModal({
                title: '登录失败',
                content: error?.message || '请重试',
                showCancel: false
            });
        }
    },

    handleCreateTenant() {
        wx.navigateTo({ url: '/pages/register/register' });
    },

    handlePasswordLogin() {
        wx.navigateTo({ url: '/pages/login/login' });
    },

    /**
     * 开发模式快速登录 - 跳过真实认证
     * 注意：正式上线前需移除此功能
     */
    devLogin() {
        // Mock 用户数据
        const mockUser = {
            id: 'dev-user-001',
            name: '开发测试员',
            role: 'admin',
            tenantId: 'dev-tenant-001',
            tenantName: '测试企业',
            avatarUrl: ''
        };
        const mockToken = 'dev-mock-token-' + Date.now();

        authStore.setLogin(mockToken, mockUser as any);

        wx.showToast({ title: '开发模式登录', icon: 'success' });
        setTimeout(() => {
            wx.reLaunch({ url: '/pages/workbench/index' });
        }, 500);
    }
});
