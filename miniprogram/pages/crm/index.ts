/**
 * 客户列表页
 * 审计修复: 添加下拉刷新、分页加载
 */
import { authStore } from '../../stores/auth-store';

Page({
    data: {
        keyword: '',
        list: [] as any[],
        loading: false,
        refreshing: false,
        loadingMore: false,
        noMore: false,
        page: 1,
        pageSize: 20,
        userInfo: null
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 2 });
        }
        this.setData({ userInfo: authStore.userInfo });
        this.resetAndFetch();
    },

    /** 重置分页并加载 */
    resetAndFetch() {
        this.setData({ page: 1, list: [], noMore: false });
        this.fetchList();
    },

    /** 获取客户列表 */
    async fetchList() {
        const { page, pageSize, loadingMore } = this.data;
        if (loadingMore) return;

        this.setData({ loading: page === 1, loadingMore: page > 1 });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/customers', {
                data: { keyword: this.data.keyword, page, limit: pageSize }
            });
            if (res.success) {
                const items = res.data || [];
                const newList = page === 1 ? items : [...this.data.list, ...items];
                this.setData({
                    list: newList,
                    noMore: items.length < pageSize,
                });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            this.setData({ loading: false, refreshing: false, loadingMore: false });
        }
    },

    /** 下拉刷新 */
    onPullDownRefresh() {
        this.setData({ refreshing: true });
        this.resetAndFetch();
    },

    /** 上拉加载更多 */
    onLoadMore() {
        if (this.data.noMore || this.data.loadingMore) return;
        this.setData({ page: this.data.page + 1 });
        this.fetchList();
    },

    onSearchInput(e: any) {
        this.setData({ keyword: e.detail.value });
    },

    onSearch() {
        this.resetAndFetch();
    },

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
        const id = e.currentTarget.dataset.id;
        wx.showActionSheet({
            itemList: ['查看详情', '开报价单'],
            success: (res) => {
                if (res.tapIndex === 0) {
                    wx.navigateTo({ url: `/pages/crm/detail/index?id=${id}` });
                } else if (res.tapIndex === 1) {
                    wx.showToast({ title: '开单功能开发中', icon: 'none' });
                }
            }
        });
    }
});
