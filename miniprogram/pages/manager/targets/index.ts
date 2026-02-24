// 移除 authStore 引入

Page({
    data: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        list: [],
        totalTarget: '0',

        // Dialog
        showDialog: false,
        currentItem: null as unknown as Record<string, any>,
        tempTarget: '',
        saving: false
    },

    onLoad() {
        this.fetchList();
    },

    async fetchList() {
        wx.showLoading({ title: '加载中...' });
        try {
            const app = getApp<IAppOption>();
            const { year, month } = this.data;
            const res = await app.request(`/sales/targets?year=${year}&month=${month}`);

            if (res.success) {
                const list = res.data;
                const total = list.reduce((sum: number, item: any) => sum + parseFloat(item.targetAmount || 0), 0);

                this.setData({
                    list,
                    totalTarget: total.toLocaleString()
                });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            wx.hideLoading();
        }
    },

    onEdit(e: any) {
        const item = e.currentTarget.dataset.item;
        this.setData({
            showDialog: true,
            currentItem: item,
            tempTarget: item.targetAmount === '0' ? '' : item.targetAmount
        });
    },

    closeDialog() {
        this.setData({ showDialog: false });
    },

    onInputTarget(e: any) {
        this.setData({ tempTarget: e.detail.value });
    },

    async onSave() {
        const { currentItem, tempTarget, year, month } = this.data;
        const amount = parseFloat(tempTarget);

        if (isNaN(amount) || amount < 0) {
            wx.showToast({ title: '请输入有效金额', icon: 'none' });
            return;
        }

        this.setData({ saving: true });

        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/sales/targets', {
                method: 'POST',
                data: {
                    userId: currentItem.userId,
                    year,
                    month,
                    targetAmount: amount
                }
            });

            if (res.success) {
                wx.showToast({ title: '设置成功', icon: 'success' });
                this.closeDialog();
                this.fetchList(); // Refresh list
            } else {
                wx.showToast({ title: res.message || '设置失败', icon: 'none' });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '网络错误', icon: 'none' });
        } finally {
            this.setData({ saving: false });
        }
    }
});

export { };
