import { authStore } from '../../stores/auth-store';

Page({
    data: {
        keyword: '',
        list: [] as any[],
        loading: false
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 2 }); // Index 2 is now Quotes
        }
        this.fetchList();
    },

    async fetchList() {
        this.setData({ loading: true });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/quotes', {
                data: { keyword: this.data.keyword }
            });
            if (res.success) {
                // Mock formatting status text
                const formatted = res.data.map((item: any) => ({
                    ...item,
                    statusText: this.getStatusText(item.status),
                    updatedAt: item.updatedAt ? item.updatedAt.split('T')[0] : ''
                }));
                this.setData({ list: formatted });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            this.setData({ loading: false });
        }
    },

    getStatusText(status: string) {
        const map: Record<string, string> = {
            'DRAFT': '草稿',
            'CONFIRMED': '已确认',
            'PENDING': '待确认'
        };
        return map[status] || status;
    },

    onSearchInput(e: any) {
        this.setData({ keyword: e.detail.value });
    },

    onSearch() {
        this.fetchList();
    },

    onAdd() {
        wx.navigateTo({ url: '/pages/quotes/create/index' });
    },

    onTapItem(e: any) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/quotes/detail?id=${id}` });
    }
});
