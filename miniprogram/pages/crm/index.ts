import { authStore } from '../../stores/auth-store';

Page({
    data: {
        keyword: '',
        list: [] as any[],
        loading: false,
        userInfo: null
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 2 });
        }
        this.setData({ userInfo: authStore.userInfo });
        this.fetchList();
    },

    async fetchList() {
        this.setData({ loading: true });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/customers', {
                data: { keyword: this.data.keyword }
            });
            if (res.success) {
                this.setData({ list: res.data });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            this.setData({ loading: false });
        }
    },

    onSearchInput(e: any) {
        this.setData({ keyword: e.detail.value });
    },

    onSearch() {
        this.fetchList();
    },

    // 跳转详情
    navigateToDetail(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/crm/detail/index?id=${id}` });
    },

    onAdd() {
        wx.navigateTo({ url: '/pages/crm/create/create' });
    },

    onCall(e: any) {
        const phone = e.currentTarget.dataset.phone;
        if (phone) {
            wx.makePhoneCall({ phoneNumber: phone });
        }
    },

    onTapItem(e: any) {
        // For now, no detail page, maybe navigate to create quote for this customer?
        const id = e.currentTarget.dataset.id;
        wx.showActionSheet({
            itemList: ['查看详情', '开报价单'],
            success: (res) => {
                if (res.tapIndex === 1) {
                    // Navigate to Create Quote with customer pre-filled
                    // wx.navigateTo({ url: `/pages/quotes/create?customerId=${id}` });
                    wx.showToast({ title: '开单功能开发中', icon: 'none' });
                }
            }
        });
    }
});
