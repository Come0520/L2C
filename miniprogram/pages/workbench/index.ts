import { authStore } from '../../stores/auth-store';

Page({
    data: {
        userInfo: null,
        dashboard: null as any,
        loading: true,
        today: ''
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 0 }); // Index 0 for Workbench
        }

        // Update user info
        this.setData({
            userInfo: authStore.userInfo,
            today: new Date().toLocaleDateString('zh-CN') // 确保中文日期
        });

        this.fetchDashboard();
    },

    navigateToCreateQuote() {
        // Navigate to Create Quote Page
        // Ideally pass a customerId if flow is from Customer Detail.
        // If from Workbench, we might need to select customer first.
        // For MVP, just go to page, page will show input (readonly though).
        // Let's assume for Demo we pass a hardcoded customer ID or handle it.
        // To allow testing, navigate regardless.
        wx.navigateTo({ url: '/pages/quotes/create/index' });
    },

    navigateToCreateCustomer() {
        // TODO: Implement Create Customer Page
        wx.showToast({ title: '录入客户功能开发中', icon: 'none' });
    },

    navigateToShowroom() {
        wx.switchTab({ url: '/pages/showroom/index' });
    },

    navigateToReports() {
        wx.navigateTo({ url: '/pages/reports/index' });
    },

    async fetchDashboard() {
        this.setData({ loading: true });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/dashboard');

            if (res.success) {
                // Ensure stats exist, or default to 0
                const s = res.data.stats || {};
                const stats = {
                    leads: s.leads || 0,
                    quotes: s.quotes || 0,
                    orders: s.orders || 0,
                    cash: s.cash || 0
                };

                this.setData({
                    dashboard: {
                        targetCompletion: 85, // Static for now, or calc from stats
                        stats: stats,
                        todos: res.data.todos || []
                    },
                    loading: false
                });
            }
        } catch (err) {
            console.error(err);
            this.setData({ loading: false });
        }
    },

    handleCardTap(e: any) {
        // Handle quick actions or stats tap
    },

    handleTodoTap(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/quotes/detail?id=${id}` });
    }
});
