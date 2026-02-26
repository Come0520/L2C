import { IAppOption } from "../../../app";
import { formatTime } from "../../../utils/util";

Page({
    data: {
        activeTab: 'PENDING', // PENDING or COMPLETED
        list: [],
        allTasks: [], // Store all, filter client side for MVP simplicity if API returns all
        loading: false,
        statusMap: {
            'PENDING_DISPATCH': '待派单',
            'PENDING_ACCEPT': '待接单',
            'IN_PROGRESS': '施工中',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
        } as Record<string, string>
    },

    onLoad() {
        this.fetchTasks();
    },

    onShow() {
        this.fetchTasks();
    },

    onPullDownRefresh() {
        this.fetchTasks().then(() => wx.stopPullDownRefresh());
    },

    onTabChange(e: WechatMiniprogram.TouchEvent) {
        const { status } = e.currentTarget.dataset;
        this.setData({ activeTab: status });
        this.filterList();
    },

    async fetchTasks() {
        this.setData({ loading: true });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/engineer/tasks');
            if (res.success) {
                const allTasks = (res.data || []).map((t: Record<string, string>) => ({
                    ...t,
                    scheduledDateFormatted: t.scheduledDate ? formatTime(new Date(t.scheduledDate)).split(' ')[0] : ''
                }));
                this.setData({ allTasks });
                this.filterList();
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.setData({ loading: false });
        }
    },

    filterList() {
        const { allTasks, activeTab } = this.data;
        let list = [];
        if (activeTab === 'PENDING') {
            // Show everything NOT completed or cancelled
            list = allTasks.filter((t: Record<string, string>) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
        } else {
            list = allTasks.filter((t: Record<string, string>) => t.status === 'COMPLETED');
        }
        this.setData({ list });
    },

    onToDetail(e: WechatMiniprogram.TouchEvent) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/projects/task-detail/index?id=${id}`
        });
    }
});

export { };
