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
        }
    },
    onLoad() {
        this.fetchList();
    },
    onPullDownRefresh() {
        this.fetchList().then(() => wx.stopPullDownRefresh());
    },
    async fetchList() {
        this.setData({ loading: true });
        const app = getApp();
        try {
            const res = await app.request('/service/tickets');
            if (res.success) {
                const list = (res.data || []).map((t) => (Object.assign(Object.assign({}, t), { createdAtFormatted: formatTime(new Date(t.createdAt)) })));
                this.setData({ list });
            }
        }
        catch (e) {
            console.error(e);
        }
        finally {
            this.setData({ loading: false });
        }
    }
});
