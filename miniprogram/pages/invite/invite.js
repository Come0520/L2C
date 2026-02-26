/**
 * 邀请员工页
 */
const app = getApp();
Page({
    data: {
        tenantStatus: '',
        roleOptions: [
            { value: 'admin', label: '管理员' },
            { value: 'sales', label: '销售' },
            { value: 'installer', label: '师傅' }, // 对应 Installer
            // { value: 'customer', label: '客户' }, // 客户通常通过另一渠道邀请? 暂时保留给员工邀请
        ],
        selectedRole: {},
        inviteCode: '',
        inviteLink: '',
        qrcodeUrl: '',
        expireTime: '',
        generating: false,
        loading: true,
        inviteList: [],
    },
    onLoad() {
        this.checkStatus();
        this.fetchInviteList();
    },
    onShow() {
        this.checkStatus();
    },
    /**
     * 检查租户状态
     */
    checkStatus() {
        const tenantStatus = app.globalData.tenantStatus || '';
        this.setData({ tenantStatus });
    },
    /**
     * 角色选择
     */
    onRoleChange(e) {
        const index = e.detail.value;
        const selectedRole = this.data.roleOptions[index];
        this.setData({ selectedRole });
    },
    /**
     * 生成邀请码
     */
    async generateInvite() {
        if (!this.data.selectedRole.value) {
            wx.showToast({ title: '请选择角色', icon: 'none' });
            return;
        }
        this.setData({ generating: true });
        try {
            const result = await app.request('/invite/generate', {
                method: 'POST',
                data: {
                    role: this.data.selectedRole.value,
                },
            });
            if (result.success) {
                const { inviteCode, inviteLink, qrcodeUrl, expiresAt } = result.data;
                this.setData({
                    inviteCode,
                    inviteLink,
                    qrcodeUrl,
                    expireTime: this.formatDate(expiresAt),
                });
                wx.showToast({ title: '生成成功', icon: 'success' });
            }
            else {
                throw new Error(result.error || '生成失败');
            }
        }
        catch (error) {
            console.error('生成邀请码失败:', error);
            wx.showToast({ title: error.message || '生成失败', icon: 'none' });
        }
        finally {
            this.setData({ generating: false });
        }
    },
    /**
     * 复制链接
     */
    copyLink() {
        wx.setClipboardData({
            data: this.data.inviteLink,
            success: () => {
                wx.showToast({ title: '已复制', icon: 'success' });
            },
        });
    },
    /**
     * 获取邀请记录
     */
    async fetchInviteList() {
        try {
            const result = await app.request('/invite/list');
            if (result.success) {
                const inviteList = (result.data || []).map((item) => (Object.assign(Object.assign({}, item), { joinTime: this.formatDate(item.createdAt), statusText: item.status === 'joined' ? '已加入' : '待接受', statusClass: item.status === 'joined' ? 'success' : 'pending' })));
                this.setData({ inviteList, loading: false });
            }
        }
        catch (error) {
            console.error('获取邀请记录失败:', error);
            this.setData({ loading: false });
        }
    },
    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr)
            return '-';
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    /**
     * 跳转到状态页
     */
    goToStatus() {
        wx.switchTab({ url: '/pages/status/status' });
    },
    /**
     * 分享给好友
     */
    onShareAppMessage() {
        const { inviteCode, selectedRole } = this.data;
        // const inviteLink = `/pages/invite/invite?inviterId=${this.data.userInfo.id}`;
        const roleName = selectedRole.label || '员工';
        // 默认分享路径：跳转到注册页并携带邀请码
        // 假设注册页是 /pages/register/register
        const path = `/pages/register/register?currentTab=1&inviteCode=${inviteCode}`;
        return {
            title: `邀请您加入团队成为${roleName}`,
            path: path,
            imageUrl: '/assets/images/invite-cover.png' // Optional: Custom cover
        };
    }
});
export {};
