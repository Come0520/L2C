import { isAppEnv } from '../../utils/env';
/**
 * 审批状态页
 */
const app = getApp();
Page({
    data: {
        status: '', // pending_approval | active | rejected | ''
        tenantInfo: null,
        submitTime: '',
        reviewTime: '',
        rejectReason: '',
        loading: true,
        // 是否支持订阅消息（多端应用模式下不支持）
        supportSubscribe: !isAppEnv(),
    },
    onLoad() {
        this.fetchStatus();
    },
    onShow() {
        this.fetchStatus();
    },
    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.fetchStatus().finally(() => {
            wx.stopPullDownRefresh();
        });
    },
    /**
     * 获取审批状态
     */
    async fetchStatus() {
        if (!app.globalData.isLoggedIn) {
            this.setData({ loading: false, status: '' });
            return;
        }
        try {
            const result = await app.request('/tenant/status');
            if (result.success && result.data) {
                const { tenant, status } = result.data;
                // 更新全局状态
                app.globalData.tenantStatus = status;
                this.setData({
                    loading: false,
                    status,
                    tenantInfo: tenant,
                    submitTime: this.formatDate(tenant === null || tenant === void 0 ? void 0 : tenant.createdAt),
                    reviewTime: this.formatDate(tenant === null || tenant === void 0 ? void 0 : tenant.reviewedAt),
                    rejectReason: (tenant === null || tenant === void 0 ? void 0 : tenant.rejectReason) || '',
                });
            }
            else {
                this.setData({ loading: false, status: '' });
            }
        }
        catch (error) {
            console.error('获取状态失败:', error);
            this.setData({ loading: false });
            wx.showToast({ title: '获取状态失败', icon: 'none' });
        }
    },
    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr)
            return '-';
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    /**
     * 跳转到邀请页
     */
    goToInvite() {
        wx.navigateTo({ url: '/pages/invite/invite' });
    },
    /**
     * 跳转到注册页
     */
    goToRegister() {
        wx.navigateTo({ url: '/pages/register/register' });
    },
    /**
     * 重新申请
     */
    reApply() {
        wx.showModal({
            title: '重新申请',
            content: '确定要重新提交入驻申请吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateTo({ url: '/pages/register/register' });
                }
            },
        });
    },
    /**
     * 订阅通知
     */
    subscribeNotification() {
        if (isAppEnv()) {
            wx.showToast({ title: '当前环境不支持消息订阅', icon: 'none' });
            return;
        }
        wx.requestSubscribeMessage({
            tmplIds: [
                // 审批结果通知模板ID
                'your_approval_template_id',
            ],
            success: (res) => {
                console.log('订阅结果:', res);
                wx.showToast({ title: '订阅成功', icon: 'success' });
            },
            fail: (err) => {
                console.error('订阅失败:', err);
                if (err.errCode === 20004) {
                    wx.showToast({ title: '用户关闭了订阅消息', icon: 'none' });
                }
                else {
                    wx.showToast({ title: '订阅失败', icon: 'none' });
                }
            },
        });
    },
});
