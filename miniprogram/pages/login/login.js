/**
 * 账号登录页
 * 审计修复: 添加 inline 错误提示、密码可见性切换
 */
const app = getApp();
import { authStore } from '../../stores/auth-store';
Page({
    data: {
        account: '',
        password: '',
        loggingIn: false,
        showPassword: false,
        errorMsg: '',
    },
    /** 切换密码可见性 */
    togglePassword() {
        this.setData({ showPassword: !this.data.showPassword });
    },
    /** 登录提交 */
    async onLogin() {
        const { account, password } = this.data;
        // 清除之前的错误
        this.setData({ errorMsg: '' });
        if (!account.trim()) {
            this.setData({ errorMsg: '请输入账号' });
            return;
        }
        if (!password) {
            this.setData({ errorMsg: '请输入密码' });
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
                // 更新 AuthStore
                try {
                    if (authStore) {
                        authStore.setLogin(token, user);
                    }
                }
                catch (_e) {
                    // AuthStore 更新失败，不影响登录流程
                }
                wx.showToast({ title: '登录成功', icon: 'success' });
                setTimeout(() => {
                    if (tenantStatus === 'pending_approval') {
                        wx.reLaunch({ url: '/pages/status/status' });
                    }
                    else if (user.role === 'installer') {
                        wx.reLaunch({ url: '/pages/tasks/index' });
                    }
                    else if (user.role === 'customer') {
                        wx.reLaunch({ url: '/pages/index/index' });
                    }
                    else {
                        wx.reLaunch({ url: '/pages/index/index' });
                    }
                }, 1000);
            }
            else {
                this.setData({ errorMsg: result.error || '登录失败' });
            }
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : '网络异常，请稍后重试';
            this.setData({ errorMsg: errMsg });
        }
        finally {
            this.setData({ loggingIn: false });
        }
    },
    /** 跳转注册/入驻 */
    goRegister() {
        wx.navigateTo({ url: '/pages/register/register' });
    }
});
