Page({
    data: {
        quoteId: '',
        quote: null as any,
        paymentConfig: null as any,
        loading: true,
        signatureWidth: 300,
        signatureHeight: 180
    },

    onLoad(options: any) {
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
        this.setData({
            signatureWidth: sys.windowWidth - 32
        });
    },

    async fetchQuote(id: string) {
        this.setData({ loading: true });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request(`/quotes/${id}`);
            if (res.success) {
                this.setData({ quote: res.data });
            } else {
                wx.showToast({ title: res.error || '加载失败', icon: 'none' });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '网络错误', icon: 'none' });
        } finally {
            this.setData({ loading: false });
        }
    },

    async fetchPaymentConfig() {
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/payment/config');
            if (res.success) {
                this.setData({ paymentConfig: res.data });
            }
        } catch (err) {
            console.error('Fetch payment config failed', err);
        }
    },

    handleClear() {
        const signature = this.selectComponent('#signature');
        signature.clear();
    },

    async handleConfirm() {
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
            const uploadResult = await this.uploadFile(filePath as string);
            if (!uploadResult || !uploadResult.success) {
                throw new Error('上传签名失败');
            }
            const signatureUrl = uploadResult.data.url;

            // 3. Submit Confirmation
            const app = getApp<IAppOption>();
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
                if (paymentConfig?.offline?.enabled && paymentConfig?.offline?.instructions) {
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
            } else {
                throw new Error(result.error);
            }

        } catch (err: any) {
            wx.hideLoading();
            console.error(err);
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
        }
    },

    async onTurnToOrder() {
        if (this.data.loading) return;

        wx.showLoading({ title: '正在创建订单...' });
        try {
            const app = getApp<IAppOption>();
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
            } else {
                throw new Error(res.error || '创建订单失败');
            }
        } catch (err: any) {
            console.error('Create Order Error', err);
            wx.showToast({ title: err.message || '网络错误', icon: 'none' });
        } finally {
            wx.hideLoading();
        }
    },

    /**
     * Helper: Upload File
     */
    uploadFile(filePath: string): Promise<any> {
        const app = getApp<IAppOption>();
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
                    } catch (e) {
                        reject(e);
                    }
                },
                fail: reject
            });
        });
    }
});
