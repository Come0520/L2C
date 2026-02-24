import { formatTime } from '../../../utils/util';

Page({
    data: {
        id: '',
        customer: null as unknown as Record<string, any>,
        loading: true
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: options.id });
            this.fetchDetail(options.id);
        }
    },

    onShow() {
        // If coming back from edit or followup, maybe refresh?
        // Better to use event channel or just refresh onShow for simplicity in MVP
        if (this.data.id && !this.data.loading) {
            this.fetchDetail(this.data.id);
        }
    },

    async fetchDetail(id: string) {
        wx.showNavigationBarLoading();
        try {
            const app = getApp<IAppOption>();
            const res = await app.request(`/crm/customers/${id}`);

            if (res.success) {
                // Format dates
                if (res.data.activities) {
                    res.data.activities = res.data.activities.map((a: any) => ({
                        ...a,
                        createdAt: formatTime(new Date(a.createdAt))
                    }));
                }

                this.setData({
                    customer: res.data,
                    loading: false
                });
            } else {
                wx.showToast({ title: '加载失败', icon: 'none' });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '网络错误', icon: 'none' });
        } finally {
            wx.hideNavigationBarLoading();
        }
    },

    onCall() {
        const { phone } = this.data.customer || {};
        if (phone) {
            wx.makePhoneCall({ phoneNumber: phone });
        }
    },

    onCopyWechat() {
        const { wechat, phone } = this.data.customer || {};
        const content = wechat || phone;
        if (content) {
            wx.setClipboardData({
                data: content,
                success: () => wx.showToast({ title: '已复制', icon: 'none' })
            });
        } else {
            wx.showToast({ title: '暂无微信信息', icon: 'none' });
        }
    },

    onNavToMap() {
        const { address } = this.data.customer || {};
        if (address) {
            // Need geocoding generally, for MVP just copy address or open map search
            // wx.openLocation requires lat/lng. 
            // If no lat/lng, maybe just copy address?
            wx.setClipboardData({
                data: address,
                success: () => wx.showToast({ title: '地址已复制', icon: 'none' })
            });
        } else {
            wx.showToast({ title: '暂无地址', icon: 'none' });
        }
    },

    onEdit() {
        // Navigate to edit page (FUTURE)
        wx.showToast({ title: '编辑功能开发中', icon: 'none' });
    },

    onAddFollowup() {
        if (!this.data.id) return;
        wx.navigateTo({
            url: `/pages/crm/followup/create?customerId=${this.data.id}`
        });
    }
});

export {};
