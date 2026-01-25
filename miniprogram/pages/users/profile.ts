import { authStore } from '../../stores/auth-store';
const app = getApp<IAppOption>();

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
        // Fix: Use 'any' casting temporarily if authStore.userInfo structure is complex or update interface
        this.setData({
            userInfo: authStore.userInfo as any
        });

        // Mock data loading - in real app would fetch from API
        // this.fetchStats(); 

        // Update TabBar selection (usually last item)
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            // Index is dynamic, logic needs to be robust or just set by matching path
            const role = authStore.currentRole;
            let index = 2; // Default for Guest/Customer
            // Fix: Check for known roles, avoiding "employee" if not in type definition
            if (role === 'admin' || role === 'sales' || role === 'installer') index = 2;
            this.getTabBar().setData({ selected: index });
        }
    },
    handleLogout() {
        wx.clearStorageSync();
        wx.reLaunch({ url: '/pages/landing/landing' });
    },

    navigateToPaymentSettings() {
        wx.navigateTo({ url: '/pages/tenant/payment-settings/index' });
    },

    navigateToInvite() {
        wx.navigateTo({ url: '/pages/invite/invite' });
    },

    /**
     * Share Electronic Business Card
     */
    onShareAppMessage() {
        const name = this.data.userInfo?.name || 'L2C用户';
        return {
            title: `你好，这是 ${name} 的电子名片`,
            path: '/pages/landing/landing', // Ideally points to a public profile page
            imageUrl: '/assets/share-card-bg.png' // You might want to generate a dynamic canvas image later
        };
    }
});
