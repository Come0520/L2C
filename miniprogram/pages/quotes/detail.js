Page({
    data: {
        quoteId: '',
        quote: null,
        paymentConfig: null,
        loading: true,
        signatureWidth: 300,
        signatureHeight: 180
    },
    onLoad(options) {
        const { id } = options;
        if (!id) {
            wx.showToast({ title: '参数错误', icon: 'none' });
            return;
        }
        this.setData({ quoteId: id });
        this.fetchQuote(id);
        this.fetchPaymentConfig();
        // Calculate responsive width
        const sys = wx.getSystemInfoSync();
        // [兼容性] App下的 windowWidth 是安全区域宽度，直接拿来算可能有边界重叠，稍微留一点边距
        this.setData({
            signatureWidth: sys.windowWidth - 32
        });
    },
    async fetchQuote(id) {
        this.setData({ loading: true });
        try {
            const app = getApp();
            const res = await app.request(`/quotes/${id}`);
            if (res.success) {
                this.setData({ quote: res.data });
            }
            else {
                wx.showToast({ title: res.error || '加载失败', icon: 'none' });
            }
        }
        catch (err) {
            console.error(err);
            wx.showToast({ title: '网络错误', icon: 'none' });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    async fetchPaymentConfig() {
        try {
            const app = getApp();
            const res = await app.request('/payment/config');
            if (res.success) {
                this.setData({ paymentConfig: res.data });
            }
        }
        catch (err) {
            console.error('Fetch payment config failed', err);
        }
    },
    handleClear() {
        const signature = this.selectComponent('#signature');
        signature.clear();
    },
    async handleConfirm() {
        var _a, _b;
        const signature = this.selectComponent('#signature');
        try {
            // 1. Export Image
            const filePath = await signature.export();
            if (!filePath) {
                wx.showToast({ title: '请先签名', icon: 'none' });
                return;
            }
            wx.showLoading({ title: '正在提交...' });
            // 2. Upload Signature
            const uploadResult = await this.uploadFile(filePath);
            if (!uploadResult || !uploadResult.success) {
                throw new Error('上传签名失败');
            }
            const signatureUrl = uploadResult.data.url;
            // 3. Submit Confirmation
            const app = getApp();
            const { quoteId } = this.data;
            const result = await app.request(`/quotes/${quoteId}/confirm`, {
                method: 'POST',
                data: { signatureUrl }
            });
            if (result.success) {
                wx.hideLoading();
                wx.showToast({ title: '确认成功', icon: 'success' });
                // Refresh Quote Status
                this.fetchQuote(quoteId);
                // Show Payment Instructions
                const { paymentConfig } = this.data;
                if (((_a = paymentConfig === null || paymentConfig === void 0 ? void 0 : paymentConfig.offline) === null || _a === void 0 ? void 0 : _a.enabled) && ((_b = paymentConfig === null || paymentConfig === void 0 ? void 0 : paymentConfig.offline) === null || _b === void 0 ? void 0 : _b.instructions)) {
                    wx.showModal({
                        title: '请安排付款',
                        content: paymentConfig.offline.instructions,
                        showCancel: false,
                        confirmText: '我知道了',
                        success: () => {
                            // Can navigate to Order Detail or stay here
                        }
                    });
                }
            }
            else {
                throw new Error(result.error);
            }
        }
        catch (err) {
            wx.hideLoading();
            console.error(err);
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
        }
    },
    async onTurnToOrder() {
        if (this.data.loading)
            return;
        wx.showLoading({ title: '正在创建订单...' });
        try {
            const app = getApp();
            const res = await app.request('/orders', {
                method: 'POST',
                data: { quoteId: this.data.quoteId }
            });
            if (res.success) {
                wx.showToast({ title: '订单创建成功', icon: 'success' });
                // Navigate to Order Detail
                const orderId = res.data.id;
                setTimeout(() => {
                    wx.navigateTo({
                        url: `/pages/orders/detail/index?id=${orderId}`
                    });
                }, 1500);
            }
            else {
                throw new Error(res.error || '创建订单失败');
            }
        }
        catch (err) {
            console.error('Create Order Error', err);
            wx.showToast({ title: err.message || '网络错误', icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    /**
     * Helper: Upload File
     */
    uploadFile(filePath) {
        const app = getApp();
        const apiBase = app.globalData.apiBase;
        // Need to manually get token for wx.uploadFile as it doesn't use the wrapper
        // In a real app, import authStore or get from storage
        const token = wx.getStorageSync('token');
        return new Promise((resolve, reject) => {
            wx.uploadFile({
                url: `${apiBase}/upload`,
                filePath: filePath,
                name: 'file',
                header: { 'Authorization': `Bearer ${token}` },
                success: (res) => {
                    try {
                        const data = JSON.parse(res.data);
                        resolve(data);
                    }
                    catch (e) {
                        reject(e);
                    }
                },
                fail: reject
            });
        });
    }
});
export {};
