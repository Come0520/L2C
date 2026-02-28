/**
 * 首页/智慧工作台
 * 融合了登录、审核状态、工作台、客户首页的所有逻辑。
 */
import { authStore, UserInfo } from '../../stores/auth-store';

const app = getApp<IAppOption>();

Page({
    data: {
        isLoggedIn: false,
        loading: false,
        userInfo: null as UserInfo | null,
        tenantStatus: '',
        role: 'guest',
        today: '',

        // 工作台业务数据
        dashboard: null as Record<string, any> | null,

        // 客户专属数据
        advisorInfo: null as Record<string, any> | null,
        pendingSignCount: 0,

        // 工人专属数据
        todayTaskCount: 0,
        pendingEarnings: '0',
    },

    onLoad() {
        // Init logic will be re-run onShow anyway to handle tab changes correctly
        this.setData({
            today: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }),
        });

        authStore.subscribe((store: any) => {
            this.updateStateFromStore(store);
        });
    },

    onShow() {
        this.updateStateFromStore(authStore);

        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            const tabBar = this.getTabBar();
            const index = tabBar.data.list.findIndex((item: any) => item.pagePath === '/pages/index/index');
            if (index !== -1) tabBar.setData({ selected: index });
        }

        if (this.data.isLoggedIn && this.data.tenantStatus === 'active') {
            const role = this.data.role;
            if (role === 'customer') {
                this.fetchCustomerData();
            } else if (role === 'worker' || role === 'installer') {
                this.fetchWorkerData();
            } else if (role === 'tester') {
                this.fetchDashboard();
                this.fetchWorkerData();
                this.fetchCustomerData();
            } else {
                this.fetchDashboard();
            }
        }
    },

    updateStateFromStore(store: any) {
        const role = (store.currentRole || store.userInfo?.role || 'guest').toLowerCase();
        this.setData({
            isLoggedIn: store.isLoggedIn,
            userInfo: store.userInfo,
            tenantStatus: store.userInfo?.tenantStatus || '',
            role
        });
    },

    // =======================================
    // 登录与注册
    // =======================================
    async onGetPhoneNumber(e: any) {
        if (e.detail.errMsg !== 'getPhoneNumber:ok') return;

        this.setData({ loading: true });
        try {
            const loginRes = await app.wxLogin();
            if (!loginRes.success) throw new Error(loginRes.error);

            const res = await app.request('/auth/decrypt-phone', {
                method: 'POST',
                data: { code: e.detail.code, openId: loginRes.openId }
            });

            if (res.success) {
                authStore.setLogin(res.data.token, res.data.user);
                wx.showToast({ title: '登录成功' });
                this.onShow(); // Reload dashboards
            } else {
                wx.showToast({ title: '登录失败', icon: 'none' });
            }
        } catch (err: any) {
            wx.showToast({ title: err.message || '登录异常', icon: 'none' });
        } finally {
            this.setData({ loading: false });
        }
    },

    goToRegister() {
        wx.navigateTo({ url: '/pages/register/register' });
    },

    logout() {
        wx.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    authStore.logout();
                }
            }
        });
    },

    // =======================================
    // 数据加载方法
    // =======================================
    async fetchDashboard() {
        this.setData({ loading: true });
        const token = authStore.token;
        if (token && token.startsWith('dev-mock-token-')) {
            this.setData({
                dashboard: {
                    targetCompletion: 85,
                    stats: { leads: 12, quotes: 8, orders: 5, cash: 28 },
                    todos: [
                        { id: 'mock-1', title: '待确认报价单', desc: '客户张三的窗帘报价', status: 'pending', statusText: '待确认', time: '10:30' },
                        { id: 'mock-2', title: '待上门测量', desc: '李四家 - 阳台窗帘', status: 'scheduled', statusText: '已排期', time: '14:00' },
                    ]
                },
                loading: false
            });
            return;
        }

        try {
            const res = await app.request('/dashboard');
            if (res.success) {
                const s = res.data.stats || {};
                const t = res.data.target || { percentage: 0 };
                this.setData({
                    dashboard: {
                        targetCompletion: t.percentage || 0,
                        stats: { leads: s.leads || 0, quotes: s.quotes || 0, orders: s.orders || 0, cash: s.cash || 0 },
                        todos: res.data.todos || []
                    },
                    loading: false
                });
            }
        } catch (err) {
            console.error('Fetch dashboard failed', err);
            this.setData({ loading: false });
        }
    },

    async fetchCustomerData() {
        this.setData({ loading: true });
        try {
            const [advisorRes, pendingRes] = await Promise.all([
                app.request('/mobile/advisor'),
                app.request('/mobile/orders?needSign=true&countOnly=true'),
            ]);

            this.setData({
                advisorInfo: advisorRes.success ? advisorRes.data : null,
                pendingSignCount: pendingRes.success ? (pendingRes.data.count || 0) : 0,
                loading: false,
            });
        } catch (err) {
            console.error('fetchCustomerData 失败', err);
            this.setData({ loading: false });
        }
    },

    async fetchWorkerData() {
        this.setData({ loading: true });
        try {
            const [tasksRes, earningsRes] = await Promise.all([
                app.request('/mobile/tasks?countOnly=true&today=true'),
                app.request('/mobile/earnings/summary'),
            ]);

            this.setData({
                todayTaskCount: tasksRes.success ? (tasksRes.data.count || 0) : 0,
                pendingEarnings: earningsRes.success ? (earningsRes.data.pendingAmount || '0') : '0',
                loading: false,
            });
        } catch (err) {
            console.error('fetchWorkerData 失败', err);
            this.setData({ loading: false });
        }
    },

    // =======================================
    // 导航方法
    // =======================================
    goToStatus() {
        wx.navigateTo({ url: '/pages/status/status' });
    },

    openNotification() {
        wx.showModal({ title: '提示', content: '消息订阅功能即将上线', showCancel: false });
    },

    goToInvite() {
        wx.navigateTo({ url: '/pages/invite/invite' });
    },

    navigateToCreateQuote() {
        wx.navigateTo({ url: '/pages/quotes/create/index' });
    },

    navigateToCreateCustomer() {
        wx.navigateTo({ url: '/pages/crm/create/create' });
    },

    navigateToShowroom() {
        wx.navigateTo({ url: '/pages/showroom/index' });
    },

    navigateToReports() {
        wx.navigateTo({ url: '/pages/reports/index' });
    },

    navigateToTargets() {
        wx.navigateTo({ url: '/pages/manager/targets/index' });
    },

    handleTodoTap(e: WechatMiniprogram.TouchEvent) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/quotes/detail?id=${id}` });
    },

    callAdvisor() {
        const advisor = this.data.advisorInfo;
        if (!advisor?.phone) {
            wx.showToast({ title: '顾问联系方式暂未配置', icon: 'none' });
            return;
        }
        wx.makePhoneCall({ phoneNumber: advisor.phone });
    },

    goToPendingSign() {
        wx.navigateTo({ url: '/pages/quotes/index?filter=needSign' });
    },

    goToShowroom() {
        wx.navigateTo({ url: '/pages/showroom/index' });
    },

    goToWarranty() {
        wx.navigateTo({ url: '/pages/service/apply/index' });
    },

    goToReview() {
        wx.navigateTo({ url: '/pages/service/list/index?tab=review' });
    },

    goToTasks() {
        wx.switchTab({ url: '/pages/tasks/index' });
    },

    goToEarnings() {
        wx.navigateTo({ url: '/pages/users/profile' });
    }
});

export { };
