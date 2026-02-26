Page({
    data: {
        config: {
            offline: { enabled: true, instructions: '' },
            online: { enabled: false }
        },
        loading: true,
        saving: false
    },

    onLoad() {
        this.fetchConfig();
    },

    async fetchConfig() {
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/tenant/payment-config');
            if (res.success) {
                this.setData({ config: res.data, loading: false });
            } else {
                wx.showToast({ title: '加载配置失败', icon: 'none' });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '网络错误', icon: 'none' });
        }
    },

    onOfflineSwitch(e: WechatMiniprogram.SwitchChange) {
        this.setData({ 'config.offline.enabled': e.detail.value });
    },

    onInstructionsInput(e: WechatMiniprogram.TouchEvent) {
        this.setData({ 'config.offline.instructions': e.detail.value });
    },

    async onSubmit() {
        this.setData({ saving: true });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/tenant/payment-config', {
                method: 'POST',
                data: this.data.config
            });

            if (res.success) {
                wx.showToast({ title: '保存成功', icon: 'success' });
                setTimeout(() => wx.navigateBack(), 1500);
            } else {
                wx.showToast({ title: res.error || '保存失败', icon: 'none' });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '保存异常', icon: 'none' });
        } finally {
            this.setData({ saving: false });
        }
    }
});

export { };
