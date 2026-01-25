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

    async handleLogin() {
        wx.showLoading({ title: '登录中...' });

        try {
            const app = getApp<IAppOption>();
            const result = await app.wxLogin();

            wx.hideLoading();

            if (result.success) {
                if (authStore.isLoggedIn) {
                    // Check for pending redirect
                    if (this.data.redirectUrl) {
                        wx.reLaunch({ url: this.data.redirectUrl });
                        return;
                    }

                    // Login success - Redirect based on role
                    // Using the same logic as app.onLaunch
                    const role = authStore.currentRole;
                    switch (role) {
                        case 'admin':
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
                            wx.showToast({ title: '未知角色', icon: 'none' });
                            break;
                    }
                } else {
                    // Debug: Show OpenID
                    console.log('OpenID:', result.openId);
                    wx.showModal({
                        title: '调试模式: OpenID',
                        content: result.openId || '未知',
                        showCancel: false,
                        confirmText: '去注册',
                        success: () => {
                            // User not registered - Redirect to Register/Bind page
                            const target = '/pages/register/register' + (this.data.redirectUrl ? `?redirect=${encodeURIComponent(this.data.redirectUrl)}` : '');
                            wx.navigateTo({ url: target });
                        }
                    });
                }
            } else {
                wx.showModal({
                    title: '登录失败验证',
                    content: result.error || '未知错误',
                    showCancel: false
                });
            }
        } catch (error: any) {
            wx.hideLoading();
            console.error(error);
            wx.showModal({
                title: '系统错误',
                content: error?.message || JSON.stringify(error),
                showCancel: false
            });
        }
    },

    handleCreateTenant() {
        wx.navigateTo({ url: '/pages/register/register' });
    }
});
