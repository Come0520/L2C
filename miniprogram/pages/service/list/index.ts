import { IAppOption } from "../../../app";
import { formatTime } from "../../../utils/util";

Page({
    data: {
        list: [],
        loading: false,
        statusMap: {
            'PENDING': '待处理',
            'PROCESSING': '处理中',
            'RESOLVED': '已解决',
            'CLOSED': '已关闭'
        } as Record<string, string>
    },

    onLoad() {
        this.fetchList();
    },

    onPullDownRefresh() {
        this.fetchList().then(() => wx.stopPullDownRefresh());
    },

    async fetchList() {
        this.setData({ loading: true });
        const app = getApp<IAppOption>();
        try {
            const res = await app.request('/service/tickets');
            if (res.success) {
                const list = (res.data || []).map((t: any) => ({
                    ...t,
                    createdAtFormatted: formatTime(new Date(t.createdAt))
                }));
                this.setData({ list });
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.setData({ loading: false });
        }
    }
});
