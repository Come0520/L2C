Page({
    data: {
        quote: null as unknown as Record<string, any>,
        paymentConfig: null as unknown as Record<string, any>,
        versions: [] as Array<{ id: string; version: number; status: string; createdAt: string }>,
        versionOptions: [] as string[],
        currentVersionIndex: 0,
        loading: true,
        signatureWidth: 300,
        signatureHeight: 180,
        showSignModal: false,  // 控制签字弹窗显示
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
        // [兼容性] App下的 windowWidth 是安全区域宽度，直接拿来算可能有边界重叠，稍微留一点边距
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
                const quoteData = res.data;
                const versions = quoteData.versions || [];

                // 状态字典
                const statusMap: Record<string, string> = {
                    DRAFT: '草稿',
                    SUBMITTED: '已提交',
                    PENDING_APPROVAL: '待审批',
                    PENDING_CUSTOMER: '待确认',
                    ACCEPTED: '已接受',
                    ORDERED: '已下单',
                    REJECTED: '已拒绝',
                    EXPIRED: '已过期',
                };

                const versionOptions = versions.map((v: any) => {
                    const statusName = statusMap[v.status] || v.status;
                    return `V${v.version} - ${statusName}${v.id === id ? ' (当前)' : ''}`;
                });

                const currentVersionIndex = versions.findIndex((v: any) => v.id === id);

                this.setData({
                    quote: quoteData,
                    versions,
                    versionOptions,
                    currentVersionIndex: currentVersionIndex >= 0 ? currentVersionIndex : 0
                });
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

    onVersionChange(e: any) {
        const index = e.detail.value;
        const selectedVersion = this.data.versions[index];
        if (selectedVersion && selectedVersion.id !== this.data.quoteId) {
            this.setData({ quoteId: selectedVersion.id });
            this.fetchQuote(selectedVersion.id);
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

    /** 打开签字弹窗 */
    openSignModal() {
        this.setData({ showSignModal: true });
    },

    /** 关闭签字弹窗并重置画板 */
    closeSignModal() {
        this.setData({ showSignModal: false });
        // 延迟重置防止动画冲突
        setTimeout(() => {
            const signature = this.selectComponent('#signature');
            if (signature) signature.clear();
        }, 300);
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

                // 关闭签字弹窗
                this.setData({ showSignModal: false });

                // 刷新报价单状态
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
    },

    /**
     * 用户点击右上角分享
     * 销售可将报价单分享给客户，客户打开后可在报价单底部签字确认
     */
    onShareAppMessage() {
        const quote = this.data.quote;
        const title = quote
            ? `【报价单】${quote.quoteNo || ''} — 请查看并签字确认`
            : '请查看报价单并签字确认';
        return {
            title,
            path: `/pages/quotes/detail?id=${this.data.quoteId}`,
        };
    },
});

export { };
