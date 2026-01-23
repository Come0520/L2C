/**
 * 首页
 */
const app = getApp<IAppOption>();

interface PageData {
    isLoggedIn: boolean;
    loading: boolean;
    userInfo: any;
    tenantStatus: string;
    statusText: string;
    statusClass: string;
    rejectReason: string;
}

Page<PageData, any>({
    data: {
        isLoggedIn: false,
        loading: false,
        userInfo: null,
        tenantStatus: '',
        statusText: '',
        statusClass: '',
        rejectReason: '',
    },

    onLoad() {
        this.checkStatus();
    },

    onShow() {
        this.checkStatus();
    },

    /**
     * 检查登录和审批状态
     */
    checkStatus() {
        const isLoggedIn = app.globalData.isLoggedIn;
        const tenantStatus = app.globalData.tenantStatus || '';
        const userInfo = app.globalData.userInfo;

        let statusText = '';
        let statusClass = '';

        switch (tenantStatus) {
            case 'pending_approval':
                statusText = '审批中';
                statusClass = 'pending';
                break;
            case 'active':
                statusText = '已激活';
                statusClass = 'success';
                break;
            case 'rejected':
                statusText = '未通过';
                statusClass = 'error';
                break;
            default:
                statusText = '未知';
                statusClass = 'pending';
        }

        this.setData({
            isLoggedIn,
            userInfo,
            tenantStatus,
            statusText,
            statusClass,
        });
    },

    /**
     * 获取手机号登录
     */
    async onGetPhoneNumber(e: any) {
        if (e.detail.errMsg !== 'getPhoneNumber:ok') {
            wx.showToast({ title: '取消登录', icon: 'none' });
            return;
        }

        this.setData({ loading: true });

        try {
            // 1. 先微信登录获取 openId
            const loginResult = await app.wxLogin();
            if (!loginResult.success) {
                throw new Error(loginResult.error || '登录失败');
            }

            // 2. 用 code 获取手机号
            const phoneResult = await app.request('/auth/decrypt-phone', {
                method: 'POST',
                data: {
                    code: e.detail.code,
                    openId: loginResult.openId,
                },
            });

            if (phoneResult.success) {
                // 保存用户信息
                app.globalData.userInfo = phoneResult.data.user;
                app.globalData.tenantId = phoneResult.data.user?.tenantId;
                app.globalData.tenantStatus = phoneResult.data.tenantStatus;
                app.globalData.isLoggedIn = true;

                wx.setStorageSync('token', phoneResult.data.token);
                wx.setStorageSync('userInfo', phoneResult.data.user);

                this.checkStatus();
                wx.showToast({ title: '登录成功', icon: 'success' });
            } else {
                // 用户未注册，跳转到注册页
                if (phoneResult.code === 'USER_NOT_FOUND') {
                    wx.navigateTo({
                        url: `/pages/register/register?phone=${phoneResult.data?.phone}`,
                    });
                } else {
                    throw new Error(phoneResult.error || '登录失败');
                }
            }
        } catch (error: any) {
            console.error('登录失败:', error);
            wx.showToast({
                title: error.message || '登录失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    /**
     * 跳转到企业注册
     */
    goToRegister() {
        wx.navigateTo({ url: '/pages/register/register' });
    },

    /**
     * 跳转到审批状态
     */
    goToStatus() {
        wx.switchTab({ url: '/pages/status/status' });
    },

    /**
     * 跳转到邀请员工
     */
    goToInvite() {
        if (this.data.tenantStatus !== 'active') {
            wx.showToast({
                title: '企业审批通过后才能邀请员工',
                icon: 'none'
            });
            return;
        }
        wx.switchTab({ url: '/pages/invite/invite' });
    },

    /**
     * 订阅消息
     */
    openNotification() {
        wx.requestSubscribeMessage({
            tmplIds: [
                // 在这里填写你的订阅消息模板ID
                'your_template_id_1',
                'your_template_id_2',
            ],
            success: (res) => {
                console.log('订阅结果:', res);
                wx.showToast({ title: '订阅成功', icon: 'success' });
            },
            fail: (err) => {
                console.error('订阅失败:', err);
                wx.showToast({ title: '订阅失败', icon: 'none' });
            },
        });
    },

    /**
     * 退出登录
     */
    logout() {
        wx.showModal({
            title: '确认退出',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    app.logout();
                }
            },
        });
    },
});
