import { formatTime } from '../../utils/util';
Page({
    data: {
        activeTab: 'ALL',
        list: [],
        loading: false,
        statusMap: {
            'DRAFT': '草稿',
            'PENDING_PAYMENT': '待付款',
            'IN_PRODUCTION': '生产中',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
        }
    },
    onLoad() {
        this.fetchList();
    },
    onShow() {
        // Auto refresh when returning
        this.fetchList();
    },
    onPullDownRefresh() {
        this.fetchList().then(() => {
            wx.stopPullDownRefresh();
        });
    },
    onTabChange(e) {
        const { status } = e.currentTarget.dataset;
        this.setData({ activeTab: status });
        this.fetchList();
    },
    async fetchList() {
        if (this.data.loading)
            return;
        this.setData({ loading: true });
        try {
            const app = getApp();
            const { activeTab } = this.data;
            const res = await app.request(`/orders?status=${activeTab === 'ALL' ? '' : activeTab}`);
            if (res.success) {
                const list = (res.data || []).map((item) => (Object.assign(Object.assign({}, item), { createdAtFormatted: formatTime(new Date(item.createdAt)) })));
                this.setData({ list });
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            this.setData({ loading: false });
        }
    },
    onToDetail(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/orders/detail/index?id=${id}`
        });
    }
});
