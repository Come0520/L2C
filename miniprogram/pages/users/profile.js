import { authStore } from '../../stores/auth-store';
Page({
    data: {
        userInfo: null,
        stats: {
            monthlySales: '12.8',
            monthlyOrders: '24',
            conversionRate: '38'
        }
    },
    onShow() {
        const user = authStore.userInfo ? Object.assign({}, authStore.userInfo) : null;
        if (user && user.role) {
            // 转换为中文角色名以便竖排展示
            const roleMap = {
                'admin': '管理员',
                'boss': '老板',
                'manager': '经理',
                'sales': '销售顾问',
                'worker': '安装师傅', // 统一使用 WORKER 角色代码
                'customer': '客户'
            };
            // 优先使用映射的中文名，否则保持原样 (转小写)
            user.displayRole = roleMap[user.role.toLowerCase()] || user.role;
        }
        this.setData({
            userInfo: user
        });
        // Mock data loading - in real app would fetch from API
        // this.fetchStats(); 
        // 更新 TabBar 高亮：「我的」在不同角色 tab 列表中位置不同
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            const tabBar = this.getTabBar();
            const index = tabBar.data.list.findIndex((item) => item.pagePath === '/pages/users/profile');
            if (index !== -1)
                tabBar.setData({ selected: index });
        }
    },
    handleLogout() {
        // 使用异步 API，避免阻塞 JS 线程（官方性能规范）
        wx.clearStorage({
            success: () => wx.reLaunch({ url: '/pages/landing/landing' }),
            fail: () => wx.reLaunch({ url: '/pages/landing/landing' }),
        });
    },
    navigateToPaymentSettings() {
        wx.navigateTo({ url: '/pages/tenant/payment-settings/index' });
    },
    navigateToInvite() {
        wx.navigateTo({ url: '/pages/invite/invite' });
    },
    navigateToServiceList() {
        wx.navigateTo({ url: '/pages/service/list/index' });
    },
    navigateToEdit() {
        wx.navigateTo({ url: '/pages/users/edit/edit' });
    },
    /**
     * Share Electronic Business Card
     */
    onShareAppMessage() {
        const user = this.data.userInfo;
        const name = (user === null || user === void 0 ? void 0 : user.name) || 'L2C用户';
        const roleText = (user === null || user === void 0 ? void 0 : user.displayRole) || '用户';
        return {
            title: `你好，我是${roleText} ${name}，这是我的电子名片`,
            path: '/pages/landing/landing',
            imageUrl: (user === null || user === void 0 ? void 0 : user.avatarUrl) || '/assets/default-avatar.png'
        };
    }
});
