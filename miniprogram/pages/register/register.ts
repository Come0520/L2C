/**
 * 企业入驻与加入申请页
 */
const app = getApp<IAppOption>();

interface FormData {
    companyName: string;
    applicantName: string;
    phone: string;
    email: string;
    region: string;
    password: string;
    confirmPassword: string;
    businessDescription: string;
}

Page({
    data: {
        currentTab: 0, // 0: 入驻申请, 1: 加入团队
        inviteCode: '',
        redirectUrl: '',
        form: {
            companyName: '',
            applicantName: '',
            phone: '',
            email: '',
            region: '',
            password: '',
            confirmPassword: '',
            businessDescription: '',
        } as FormData,
        regionValue: [] as string[],
        submitting: false,
        templates: {} as Record<string, string>,
    },

    onLoad(options: any) {
        // 如果从登录页传来手机号，预填充
        if (options.phone) {
            this.setData({ 'form.phone': options.phone });
        }
        if (options.redirect) {
            this.setData({ redirectUrl: decodeURIComponent(options.redirect) });
        }
        this.fetchConfig();
    },

    /**
     * 获取配置
     */
    async fetchConfig() {
        try {
            const res = await app.request('/config');
            if (res.success && res.data?.templates) {
                this.setData({ templates: res.data.templates });
            }
        } catch (e) {
            console.error('Fetch Config Failed', e);
        }
    },

    /**
     * 切换 Tab
     */
    switchTab(e: any) {
        const index = Number(e.currentTarget.dataset.index);
        this.setData({ currentTab: index });
    },

    /**
     * 邀请码输入
     */
    onInviteCodeInput(e: any) {
        this.setData({ inviteCode: e.detail.value });
    },

    /**
     * 表单输入处理
     */
    onInput(e: any) {
        const { field } = e.currentTarget.dataset;
        const { value } = e.detail;
        this.setData({ [`form.${field}`]: value });
    },

    /**
     * 地区选择
     */
    onRegionChange(e: any) {
        const { value } = e.detail;
        this.setData({
            regionValue: value,
            'form.region': value.join(' '),
        });
    },

    /**
     * 表单验证
     */
    validateForm(): string | null {
        const { form } = this.data;

        if (!form.companyName.trim()) return '请输入企业名称';
        if (form.companyName.length < 2) return '企业名称至少2个字符';

        if (!form.applicantName.trim()) return '请输入联系人姓名';

        if (!form.phone) return '请输入手机号';
        if (!/^1[3-9]\d{9}$/.test(form.phone)) return '请输入有效的手机号';

        if (!form.email) return '请输入邮箱';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '请输入有效的邮箱';

        if (!form.region) return '请选择地区';

        if (!form.password) return '请设置密码';
        if (form.password.length < 6) return '密码至少6位';

        if (form.password !== form.confirmPassword) return '两次密码输入不一致';

        return null;
    },

    /**
     * 提交入驻申请
     */
    async onSubmit() {
        const error = this.validateForm();
        if (error) {
            wx.showToast({ title: error, icon: 'none' });
            return;
        }

        this.setData({ submitting: true });

        // 请求订阅消息授权
        const { tenantApproved, tenantRejected } = this.data.templates;
        if (tenantApproved && tenantRejected) {
            try {
                await new Promise<void>((resolve) => {
                    wx.requestSubscribeMessage({
                        tmplIds: [tenantApproved, tenantRejected],
                        success: (res) => { console.log('Subscribe success', res); },
                        fail: (err) => { console.error('Subscribe fail', err); },
                        complete: () => resolve()
                    });
                });
            } catch (e) {
                console.error('Subscribe error', e);
            }
        }

        try {
            const { form } = this.data;
            const openId = app.globalData.openId || wx.getStorageSync('openId');

            const result = await app.request('/tenant/apply', {
                method: 'POST',
                data: {
                    companyName: form.companyName,
                    applicantName: form.applicantName,
                    phone: form.phone,
                    email: form.email,
                    region: form.region,
                    password: form.password,
                    businessDescription: form.businessDescription,
                    openId: openId, // 绑定微信
                },
            });

            if (result.success) {
                // 保存用户信息
                app.globalData.tenantId = result.data.tenantId;
                app.globalData.tenantStatus = 'pending_approval';
                app.globalData.isLoggedIn = true;

                if (result.data.user) {
                    app.globalData.userInfo = result.data.user;
                    wx.setStorageSync('userInfo', result.data.user);
                }
                if (result.data.token) {
                    wx.setStorageSync('token', result.data.token);
                }

                // 跳转
                const { redirectUrl } = this.data;

                wx.showModal({
                    title: '申请已提交',
                    content: '您的入驻申请已提交，我们将在1-3个工作日内审核',
                    showCancel: false,
                    success: () => {
                        if (redirectUrl) {
                            wx.reLaunch({ url: redirectUrl });
                        } else {
                            wx.switchTab({ url: '/pages/status/status' });
                        }
                    },
                });
            } else {
                throw new Error(result.error || '提交失败');
            }
        } catch (error: any) {
            console.error('提交失败:', error);
            wx.showToast({
                title: error.message || '提交失败，请重试',
                icon: 'none',
            });
        } finally {
            this.setData({ submitting: false });
        }
    },

    /**
     * 提交加入申请 (邀请码)
     */
    async onJoinSubmit() {
        const { inviteCode } = this.data;
        if (!inviteCode.trim()) {
            wx.showToast({ title: '请输入邀请码', icon: 'none' });
            return;
        }

        this.setData({ submitting: true });

        try {
            const openId = app.globalData.openId || wx.getStorageSync('openId');
            const result = await app.request('/invite/accept', {
                method: 'POST',
                data: {
                    code: inviteCode,
                    openId: openId
                }
            });

            if (result.success) {
                // Update Global Store
                if (result.data.user) {
                    app.globalData.userInfo = result.data.user;
                    app.globalData.tenantId = result.data.user.tenantId;
                    app.globalData.isLoggedIn = true;

                    // Also update AuthStore if using it
                    const { authStore } = require('../../stores/auth-store');
                    if (authStore) {
                        authStore.setLogin(result.data.token, result.data.user);
                    }
                }

                wx.showToast({ title: '加入成功', icon: 'success' });

                setTimeout(() => {
                    // Check for Pending Redirect (Cold Launch)
                    if (this.data.redirectUrl) {
                        wx.reLaunch({ url: this.data.redirectUrl });
                        return;
                    }

                    const role = result.data.user?.role;
                    if (role === 'installer') {
                        wx.reLaunch({ url: '/pages/tasks/index' });
                    } else if (role === 'customer') {
                        wx.reLaunch({ url: '/pages/index/index' });
                    } else {
                        wx.reLaunch({ url: '/pages/workbench/index' });
                    }
                }, 1500);
            } else {
                throw new Error(result.error || '加入失败');
            }
        } catch (error: any) {
            console.error('加入失败:', error);
            wx.showToast({ title: error.message || '邀请码无效或已过期', icon: 'none' });
        } finally {
            this.setData({ submitting: false });
        }
    },

    /**
     * 返回
     */
    goBack() {
        wx.navigateBack();
    },
});

export {};
