/**
 * 企业入驻申请页
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
    },

    onLoad(options: any) {
        // 如果从登录页传来手机号，预填充
        if (options.phone) {
            this.setData({ 'form.phone': options.phone });
        }
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
     * 提交表单
     */
    async onSubmit() {
        const error = this.validateForm();
        if (error) {
            wx.showToast({ title: error, icon: 'none' });
            return;
        }

        this.setData({ submitting: true });

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

                // 跳转到状态页
                wx.showModal({
                    title: '申请已提交',
                    content: '您的入驻申请已提交，我们将在1-3个工作日内审核',
                    showCancel: false,
                    success: () => {
                        wx.switchTab({ url: '/pages/status/status' });
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
     * 返回
     */
    goBack() {
        wx.navigateBack();
    },
});
