
// authStore 用于在 onLoad/onShow 中使用 (如果后续有需要的话)

const app = getApp<IAppOption>();

Page({
    data: {
        activeTab: 'mine', // mine | pool
        keyword: '',
        list: [] as Record<string, any>[],
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
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            const tabBar = this.getTabBar();
            const index = tabBar.data.list.findIndex((item: any) => item.pagePath === '/pages/leads/index');
            if (index !== -1) tabBar.setData({ selected: index });
        }
    },

    async fetchList(reset = false) {
        if (this.data.loading) return;

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
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            this.setData({ loading: false });
            wx.stopPullDownRefresh();
        }
    },

    onTabChange(e: any) {
        const tab = e.currentTarget.dataset.tab;
        if (tab === this.data.activeTab) return;

        this.setData({ activeTab: tab, list: [], hasMore: true });
        this.fetchList(true);
    },

    onSearchInput(e: any) {
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

    navigateToDetail(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/leads-sub/detail/index?id=${id}` });
    },

    navigateToAdd() {
        wx.navigateTo({ url: '/pages/leads-sub/create/index' });
    }
});

export { };
