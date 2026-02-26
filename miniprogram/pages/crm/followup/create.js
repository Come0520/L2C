Page({
    data: {
        customerId: '',
        form: {
            type: 'VISIT',
            description: ''
        },
        typeOptions: [
            { label: '上门拜访', value: 'VISIT' },
            { label: '电话沟通', value: 'CALL' },
            { label: '微信沟通', value: 'WECHAT' },
            { label: '其他', value: 'OTHER' }
        ],
        submitting: false
    },
    onLoad(options) {
        if (options.customerId) {
            this.setData({ customerId: options.customerId });
        }
        else {
            wx.showToast({ title: '参数错误', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 1500);
        }
    },
    onTypeSelect(e) {
        const type = e.currentTarget.dataset.value;
        this.setData({ 'form.type': type });
    },
    onInputContent(e) {
        this.setData({ 'form.description': e.detail.value });
    },
    async onSubmit() {
        const { customerId, form } = this.data;
        if (!form.description.trim()) {
            wx.showToast({ title: '请输入跟进内容', icon: 'none' });
            return;
        }
        this.setData({ submitting: true });
        try {
            const app = getApp();
            const res = await app.request('/crm/activities', {
                method: 'POST',
                data: {
                    customerId,
                    type: form.type,
                    description: form.description,
                    // images: [], location: null (MVP)
                }
            });
            if (res.success) {
                wx.showToast({ title: '保存成功', icon: 'success' });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1000);
            }
            else {
                wx.showToast({ title: res.message || '保存失败', icon: 'none' });
            }
        }
        catch (err) {
            console.error(err);
            wx.showToast({ title: '网络错误', icon: 'none' });
        }
        finally {
            this.setData({ submitting: false });
        }
    }
});
export {};
