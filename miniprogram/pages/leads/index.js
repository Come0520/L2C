// 引用 app 实例
const app = getApp();
Page({
    data: {
        activeTab: 'mine', // mine | pool
        keyword: '',
        list: [],
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: true,
        loading: false,
        isRefreshing: false
    },
    onLoad() {
        this.fetchList(true);
    },
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar())
            this.getTabBar().setData({ selected: 1 }); // 线索是 adminTabs[1]，角色 tab 列表索引为 1
    },
    async fetchList(reset = false) {
        if (this.data.loading)
            return;
        const { activeTab, keyword, page, pageSize, list } = this.data;
        const currentPage = reset ? 1 : page;
        this.setData({ loading: true });
        try {
            const res = await app.request(`/leads?type=${activeTab}&page=${currentPage}&pageSize=${pageSize}&keyword=${keyword}`);
            if (res.success) {
                const { items, pagination } = res.data;
                const newList = reset ? items : [...list, ...items];
                this.setData({
                    list: newList,
                    page: currentPage + 1,
                    total: pagination.total,
                    hasMore: newList.length < pagination.total,
                    isRefreshing: false
                });
            }
        }
        catch (err) {
            console.error(err);
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
        finally {
            this.setData({ loading: false });
            wx.stopPullDownRefresh();
        }
    },
    onTabChange(e) {
        const tab = e.currentTarget.dataset.tab;
        if (tab === this.data.activeTab)
            return;
        this.setData({ activeTab: tab, list: [], hasMore: true });
        this.fetchList(true);
    },
    onSearchInput(e) {
        this.setData({ keyword: e.detail.value });
    },
    onSearch() {
        this.fetchList(true);
    },
    onPullDownRefresh() {
        this.setData({ isRefreshing: true });
        this.fetchList(true);
    },
    onReachBottom() {
        if (this.data.hasMore && !this.data.loading) {
            this.fetchList();
        }
    },
    navigateToDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/leads-sub/detail/index?id=${id}` });
    },
    navigateToAdd() {
        wx.navigateTo({ url: '/pages/leads-sub/create/index' });
    }
});
export { };
