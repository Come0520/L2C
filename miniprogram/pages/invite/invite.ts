/**
 * 邀请员工页
 */
const app = getApp<IAppOption>();

interface RoleOption {
    value: string;
    label: string;
}

interface InviteRecord {
    id: string;
    name: string;
    phone: string;
    roleName: string;
    joinTime: string;
    status: string;
    statusText: string;
    statusClass: string;
}

Page({
    data: {
        tenantStatus: '',
        roleOptions: [
            { value: 'ADMIN', label: '管理员' },
            { value: 'MANAGER', label: '主管' },
            { value: 'SALESPERSON', label: '销售' },
            { value: 'STAFF', label: '员工' },
        ] as RoleOption[],
        selectedRole: {} as RoleOption,
        inviteCode: '',
        inviteLink: '',
        qrcodeUrl: '',
        expireTime: '',
        generating: false,
        loading: true,
        inviteList: [] as InviteRecord[],
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
    onRoleChange(e: any) {
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
            } else {
                throw new Error(result.error || '生成失败');
            }
        } catch (error: any) {
            console.error('生成邀请码失败:', error);
            wx.showToast({ title: error.message || '生成失败', icon: 'none' });
        } finally {
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
                const inviteList = (result.data || []).map((item: any) => ({
                    ...item,
                    joinTime: this.formatDate(item.createdAt),
                    statusText: item.status === 'joined' ? '已加入' : '待接受',
                    statusClass: item.status === 'joined' ? 'success' : 'pending',
                }));

                this.setData({ inviteList, loading: false });
            }
        } catch (error) {
            console.error('获取邀请记录失败:', error);
            this.setData({ loading: false });
        }
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    /**
     * 跳转到状态页
     */
    goToStatus() {
        wx.switchTab({ url: '/pages/status/status' });
    },
});
