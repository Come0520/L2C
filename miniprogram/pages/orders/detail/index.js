Page({
    data: {
        orderId: '',
        order: null,
        loading: true,
        statusMap: {
            'PENDING_PAYMENT': '待付款',
            'IN_PRODUCTION': '生产中',
            'COMPLETED': '已完成'
        },
        // Modal
        showPayModal: false,
        pendingScheduleId: '',
        pendingPayAmount: '',
        actualAmount: '',
        proofImg: '',
        paymentMethods: ['CASH', 'TRANSFER', 'WECHAT'],
        paymentMethodIndex: 1, // Default Transfer
        submitting: false
    },
    onLoad(options) {
        const { id } = options;
        if (id) {
            this.setData({ orderId: id });
            this.fetchDetail(id);
        }
    },
    async fetchDetail(id) {
        try {
            const app = getApp();
            const res = await app.request(`/orders/${id}`);
            if (res.success) {
                this.setData({ order: res.data, loading: false });
            }
        }
        catch (e) {
            console.error(e);
        }
    },
    // --- Payment Logic ---
    onOpenPayModal(e) {
        const { id, amount } = e.currentTarget.dataset;
        this.setData({
            showPayModal: true,
            pendingScheduleId: id,
            pendingPayAmount: amount,
            actualAmount: amount, // Pre-fill
            proofImg: ''
        });
    },
    onClosePayModal() {
        this.setData({ showPayModal: false });
    },
    onAmountInput(e) {
        this.setData({ actualAmount: e.detail.value });
    },
    onMethodChange(e) {
        this.setData({ paymentMethodIndex: e.detail.value });
    },
    async onChooseImage() {
        try {
            const res = await wx.chooseMedia({ count: 1, mediaType: ['image'] });
            const filePath = res.tempFiles[0].tempFilePath;
            wx.showLoading({ title: '上传中...' });
            // Upload logic (Inline or helper)
            const app = getApp();
            const apiBase = app.globalData.apiBase;
            const token = wx.getStorageSync('token');
            wx.uploadFile({
                url: `${apiBase}/upload`,
                filePath: filePath,
                name: 'file',
                header: { 'Authorization': `Bearer ${token}` },
                success: (upRes) => {
                    wx.hideLoading();
                    const data = JSON.parse(upRes.data);
                    if (data.success) {
                        this.setData({ proofImg: data.data.url });
                    }
                    else {
                        wx.showToast({ title: '上传失败', icon: 'none' });
                    }
                },
                fail: () => {
                    wx.hideLoading();
                    wx.showToast({ title: '网络失败', icon: 'none' });
                }
            });
        }
        catch (e) {
            console.error(e);
        }
    },
    async onSubmitPayment() {
        const { pendingScheduleId, actualAmount, proofImg, paymentMethods, paymentMethodIndex } = this.data;
        if (!actualAmount || !proofImg) {
            wx.showToast({ title: '请填写完整信息', icon: 'none' });
            return;
        }
        this.setData({ submitting: true });
        try {
            const app = getApp();
            const res = await app.request('/orders/payments', {
                method: 'POST',
                data: {
                    scheduleId: pendingScheduleId,
                    actualAmount,
                    proofImg,
                    paymentMethod: paymentMethods[paymentMethodIndex]
                }
            });
            if (res.success) {
                wx.showToast({ title: '录入成功', icon: 'success' });
                this.setData({ showPayModal: false });
                this.fetchDetail(this.data.orderId); // Refresh
            }
            else {
                wx.showToast({ title: res.error || '失败', icon: 'none' });
            }
        }
        catch (e) {
            wx.showToast({ title: '网络错误', icon: 'none' });
        }
        finally {
            this.setData({ submitting: false });
        }
    },
    onPreviewImage(e) {
        const { src } = e.currentTarget.dataset;
        wx.previewImage({ urls: [src] });
    },
    onApplyAfterSales() {
        if (!this.data.order)
            return;
        wx.navigateTo({
            url: `/pages/service/apply/index?orderId=${this.data.order.id}&orderNo=${this.data.order.orderNo}`
        });
    }
});
export {};
