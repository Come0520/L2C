/**
 * 账号登录页
 */
const app = getApp<IAppOption>();

Page({
    data: {
        account: '',
        password: '',
        loggingIn: false,
    },

    /**
     * 输入处理
     */
    onInput(e: any) {
        const { field } = e.currentTarget.dataset;
        this.setData({ [field]: e.detail.value });
    },

    /**
     * 登录提交
     */
    async onLogin() {
        const { account, password } = this.data;

        if (!account.trim()) {
            wx.showToast({ title: '请输入账号', icon: 'none' });
            return;
        }
        if (!password) {
            wx.showToast({ title: '请输入密码', icon: 'none' });
            return;
        }

        this.setData({ loggingIn: true });

        try {
            const result = await app.request('/auth/login', {
                method: 'POST',
                data: { account, password },
            });

            if (result.success) {
                const { user, token, tenantStatus } = result.data;

                // 保存用户信息
                app.globalData.userInfo = user;
                app.globalData.tenantId = user.tenantId;
                app.globalData.tenantStatus = tenantStatus;
                app.globalData.isLoggedIn = true;

                wx.setStorageSync('token', token);
                wx.setStorageSync('userInfo', user);

                // 更新 AuthStore (如果在用)
                try {
                    const { authStore } = require('../../stores/auth-store');
                    if (authStore) {
                        authStore.setLogin(token, user);
                    }
                } catch (_e) {
                    // console.log('Update AuthStore failed, skipping...');
                }

                wx.showToast({ title: '登录成功', icon: 'success' });

                setTimeout(() => {
                    if (tenantStatus === 'pending_approval') {
                        wx.reLaunch({ url: '/pages/status/status' });
                    } else if (user.role === 'installer') {
                        wx.reLaunch({ url: '/pages/tasks/index' });
                    } else if (user.role === 'customer') {
                        wx.reLaunch({ url: '/pages/index/index' });
                    } else {
                        // 默认去工作台
                        wx.reLaunch({ url: '/pages/workbench/index' });
                    }
                }, 1000);

            } else {
                throw new Error(result.error || '登录失败');
            }
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : '账号或密码错误';
            console.error('Login Failed', error);
            wx.showToast({
                title: errMsg,
                icon: 'none'
            });
        } finally {
            this.setData({ loggingIn: false });
        }
    },

    /**
     * 跳转注册/入驻
     */
    goRegister() {
        wx.navigateTo({ url: '/pages/register/register' });
    }
});

export { }; // Ensure this is treated as a module
