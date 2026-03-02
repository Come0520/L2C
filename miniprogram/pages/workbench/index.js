import { authStore } from '../../stores/auth-store';
Page({
    data: {
        userInfo: null,
        dashboard: null,
        loading: false,
        today: ''
    },
    onShow() {
        // 动态查找当前页面在角色 TabBar 列表中的索引（铁律 2.5）
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            const tabBar = this.getTabBar();
            const index = tabBar.data.list.findIndex((item) => item.pagePath === '/pages/index/index');
            if (index !== -1) tabBar.setData({ selected: index });
        }
        // Update user info
        this.setData({
            userInfo: authStore.userInfo,
            today: new Date().toLocaleDateString('zh-CN') // 确保中文日期
        });
        this.fetchDashboard();
    },
    navigateToCreateQuote() {
        wx.navigateTo({ url: '/pages/quotes/create/index' });
    },
    navigateToCreateCustomer() {
        wx.navigateTo({ url: '/pages/crm/create/create' });
    },
    navigateToShowroom() {
        // 展厅已加入 TabBar，必须用 switchTab（铁律 2.1）
        wx.switchTab({ url: '/pages/showroom/index' });
    },
    navigateToReports() {
        wx.navigateTo({ url: '/pages/reports/index' });
    },
    navigateToTargets() {
        wx.navigateTo({ url: '/pages/manager/targets/index' });
    },
    async fetchDashboard() {
        this.setData({ loading: true });
        // 开发模式检测 - 使用 Mock 数据
        const token = authStore.token;
        if (token && token.startsWith('dev-mock-token-')) {
            this.setData({
                dashboard: {
                    targetCompletion: 85,
                    stats: { leads: 12, quotes: 8, orders: 5, cash: 28 },
                    todos: [
                        { id: 'mock-1', title: '待确认报价单', desc: '客户张三的窗帘报价', status: 'pending', time: '10:30' },
                        { id: 'mock-2', title: '待上门测量', desc: '李四家 - 阳台窗帘', status: 'scheduled', time: '14:00' },
                        { id: 'mock-3', title: '待安装', desc: '王五家 - 客厅窗帘', status: 'ready', time: '明天' },
                    ]
                },
                loading: false
            });
            return;
        }
        try {
            this.setData({ loading: true });
            const res = await getApp().request({
                url: '/dashboard'
            });
            if (res.success) {
                // Ensure stats exist, or default to 0
                const s = res.data.stats || {};
                const t = res.data.target || { percentage: 0 };
                const stats = {
                    leads: s.leads || 0,
                    quotes: s.quotes || 0,
                    orders: s.orders || 0,
                    cash: s.cash || 0,
                    conversionRate: s.conversionRate || '0.0',
                    avgOrderValue: s.avgOrderValue || '0'
                };
                this.setData({
                    dashboard: {
                        targetCompletion: t.percentage || 0,
                        stats: stats,
                        todos: res.data.todos || []
                    },
                    loading: false
                });
            }
        }
        catch (err) {
            console.error(err);
            this.setData({ loading: false });
        }
    },
    handleCardTap() {
        // Handle quick actions or stats tap
    },
    handleTodoTap(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/quotes/detail?id=${id}` });
    }
});
