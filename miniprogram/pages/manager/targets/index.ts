import { IAppOption } from '../../../../app';

Page({
    data: {
        activeTab: 'monthly', // 'monthly' | 'weekly'
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        // 计算当前周数的简单粗暴逻辑（ISO）直接拿前端近似替代
        week: 1,

        // 渲染数据
        list: [],
        totalTarget: '0',
        totalAchieved: '0',
        totalRate: 0,

        // Dialog
        showDialog: false,
        currentItem: null as unknown as Record<string, any>,
        tempTarget: '',
        saving: false
    },

    onLoad() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);

        this.setData({ week });
        this.fetchList();
    },

    switchTab(e: any) {
        const tab = e.currentTarget.dataset.tab;
        if (this.data.activeTab === tab) return;
        this.setData({ activeTab: tab });
        this.fetchList();
    },

    async fetchList() {
        wx.showLoading({ title: '加载中...' });
        try {
            const app = getApp<IAppOption>();
            const { activeTab, year, month, week } = this.data;
            let url = '';

            if (activeTab === 'monthly') {
                url = `/sales/targets?year=${year}&month=${month}`;
            } else {
                url = `/sales/weekly-targets?year=${year}&week=${week}`;
            }

            const res = await app.request(url);

            if (res.success) {
                const list = res.data;
                const total = list.reduce((sum: number, item: any) => sum + parseFloat(item.targetAmount || 0), 0);
                const totalAchieved = list.reduce((sum: number, item: any) => sum + parseFloat(item.achievedAmount || 0), 0);
                const totalRate = total > 0 ? Math.round((totalAchieved / total) * 1000) / 10 : 0;

                this.setData({
                    list,
                    totalTarget: total.toLocaleString(),
                    totalAchieved: totalAchieved.toLocaleString(),
                    totalRate
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
        const { activeTab, currentItem, tempTarget, year, month, week } = this.data;
        const amount = parseFloat(tempTarget);

        if (isNaN(amount) || amount < 0) {
            wx.showToast({ title: '请输入有效金额', icon: 'none' });
            return;
        }

        this.setData({ saving: true });

        try {
            const app = getApp<IAppOption>();
            let url = '';
            let data: any = {};

            if (activeTab === 'monthly') {
                url = '/sales/targets';
                data = { userId: currentItem.userId, year, month, targetAmount: amount };
            } else {
                url = '/sales/weekly-targets';
                data = { userId: currentItem.userId, year, week, targetAmount: amount };
            }

            const res = await app.request(url, {
                method: 'POST',
                data
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
