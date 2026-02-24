/**
 * 报价单列表页
 * 审计修复: 添加下拉刷新、状态中文映射完善、上拉分页
 */
// import { authStore } from '../../stores/auth-store';

/** 报价单状态中文映射 */
const STATUS_MAP: Record<string, string> = {
    'DRAFT': '草稿',
    'PENDING_APPROVAL': '待审批',
    'APPROVED': '已批准',
    'PENDING_CUSTOMER': '待确认',
    'ACCEPTED': '已接受',
    'REJECTED': '已拒绝',
    'LOCKED': '已锁定',
    'ORDERED': '已转单',
    'EXPIRED': '已过期',
    'CONFIRMED': '已确认',
    'PENDING': '待确认',
};

Page({
    data: {
        keyword: '',
        list: [] as Record<string, any>[],
        loading: false,
        refreshing: false,
        loadingMore: false,
        noMore: false,
        page: 1,
        pageSize: 20,
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 2 });
        }
        this.resetAndFetch();
    },

    /** 重置分页并加载 */
    resetAndFetch() {
        this.setData({ page: 1, list: [], noMore: false });
        this.fetchList();
    },

    /** 获取报价单列表 */
    async fetchList() {
        const { page, pageSize, loadingMore } = this.data;
        if (loadingMore) return;

        this.setData({ loading: page === 1, loadingMore: page > 1 });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/quotes', {
                data: { keyword: this.data.keyword, page, limit: pageSize }
            });
            if (res.success) {
                const formatted = (res.data || []).map((item: any) => ({
                    ...item,
                    statusText: STATUS_MAP[item.status] || item.status,
                    updatedAt: item.updatedAt ? item.updatedAt.split('T')[0] : ''
                }));

                const newList = page === 1 ? formatted : [...this.data.list, ...formatted];
                this.setData({
                    list: newList,
                    noMore: formatted.length < pageSize,
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

    onAdd() {
        wx.navigateTo({ url: '/pages/quotes/create/index' });
    },

    onTapItem(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/quotes/detail?id=${id}` });
    }
});

export { };
