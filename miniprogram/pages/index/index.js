/**
 * 首页
 */
import { authStore } from '../../stores/auth-store';
const app = getApp();
Page({
    data: {
        isLoggedIn: false,
        loading: false,
        userInfo: null,
        tenantStatus: '',
        dashboardData: null,
    },
    onLoad() {
        var _a;
        // Subscribe to auth store
        authStore.subscribe((store) => {
            var _a;
            this.setData({
                isLoggedIn: store.isLoggedIn,
                userInfo: store.userInfo,
                tenantStatus: ((_a = store.userInfo) === null || _a === void 0 ? void 0 : _a.tenantStatus) || '',
            });
            if (store.isLoggedIn) {
                this.fetchDashboard();
            }
        });
        // Initial check
        const isLoggedIn = authStore.isLoggedIn;
        this.setData({
            isLoggedIn,
            userInfo: authStore.userInfo,
            tenantStatus: ((_a = authStore.userInfo) === null || _a === void 0 ? void 0 : _a.tenantStatus) || '',
        });
        if (isLoggedIn) {
            this.fetchDashboard();
        }
    },
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().init();
        }
        if (this.data.isLoggedIn) {
            this.fetchDashboard();
        }
    },
    async fetchDashboard() {
        try {
            const res = await app.request('/dashboard');
            if (res.success) {
                this.setData({ dashboardData: res.data });
            }
        }
        catch (err) {
            console.error('Fetch dashboard failed', err);
        }
    },
    async onGetPhoneNumber(e) {
        if (e.detail.errMsg !== 'getPhoneNumber:ok')
            return;
        this.setData({ loading: true });
        try {
            const loginRes = await app.wxLogin();
            if (!loginRes.success)
                throw new Error(loginRes.error);
            const res = await app.request('/auth/decrypt-phone', {
                method: 'POST',
                data: { code: e.detail.code, openId: loginRes.openId }
            });
            if (res.success) {
                authStore.setLogin(res.data.token, res.data.user);
                wx.showToast({ title: '登录成功' });
            }
            else {
                wx.showToast({ title: '登录失败', icon: 'none' });
            }
        }
        catch (err) {
            wx.showToast({ title: err.message || '登录异常', icon: 'none' });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    goToRegister() {
        wx.navigateTo({ url: '/pages/register/register' });
    }
});
