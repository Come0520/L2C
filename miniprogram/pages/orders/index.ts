import { IAppOption } from '../../app';
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
        } as Record<string, string>
    },

    onLoad() {
        this.fetchList();
    },

    onShow() {
        // 注意：订单页在分包内，不在 tabBar.list 中
        // 框架不会自动注入 getTabBar，移除硬编码（铁律 2.5）
        // 返回详情页后自动刷新
        this.fetchList();
    },

    onPullDownRefresh() {
        this.fetchList().then(() => {
            wx.stopPullDownRefresh();
        });
    },

    onTabChange(e: any) {
        const { status } = e.currentTarget.dataset;
        this.setData({ activeTab: status });
        this.fetchList();
    },

    async fetchList() {
        if (this.data.loading) return;
        this.setData({ loading: true });

        try {
            const app = getApp<IAppOption>();
            const { activeTab } = this.data;
            const res = await app.request(`/orders?status=${activeTab === 'ALL' ? '' : activeTab}`);

            if (res.success) {
                const list = (res.data || []).map((item: any) => ({
                    ...item,
                    createdAtFormatted: formatTime(new Date(item.createdAt))
                }));
                this.setData({ list });
            }
        } catch (err) {
            console.error(err);
        } finally {
            this.setData({ loading: false });
        }
    },

    onToDetail(e: any) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/orders/detail/index?id=${id}`
        });
    }
});

export { };
