/**
 * 编辑个人资料
 */
import { authStore } from '../../../stores/auth-store';
const app = getApp<IAppOption>();

Page({
    data: {
        userInfo: {
            name: '',
            phone: '',
            avatarUrl: ''
        },
        submitting: false
    },

    onLoad() {
        const user = authStore.userInfo;
        if (user) {
            this.setData({
                userInfo: {
                    name: user.name || '',
                    phone: (user as any).phone || '', // Assuming phone exists in user object
                    avatarUrl: user.avatarUrl || ''
                }
            });
        }
    },

    /**
     * 选择头像
     */
    onChooseAvatar(e: any) {
        const { avatarUrl } = e.detail;
        this.setData({
            'userInfo.avatarUrl': avatarUrl
        });
    },

    /**
     * 输入姓名
     */
    onNameInput(e: any) {
        this.setData({
            'userInfo.name': e.detail.value
        });
    },

    /**
     * 保存
     */
    async onSave() {
        const { name, avatarUrl } = this.data.userInfo;

        if (!name.trim()) {
            wx.showToast({ title: '请输入姓名', icon: 'none' });
            return;
        }

        this.setData({ submitting: true });

        try {
            // 1. 如果头像被修改且是临时路径，需要上传
            let finalAvatarUrl = avatarUrl;
            if (avatarUrl && (avatarUrl.startsWith('http://tmp') || avatarUrl.startsWith('wxfile://'))) {
                // Upload logic here (Mock for now, or use existing upload API)
                // const uploadRes = await app.uploadFile(avatarUrl);
                // finalAvatarUrl = uploadRes.url;
            }

            // 2. 更新用户信息 API
            // const res = await app.request('/users/profile', { method: 'PUT', data: { name, avatarUrl: finalAvatarUrl } });

            // MOCK Update Success
            const updatedUser = { ...authStore.userInfo, name, avatarUrl: finalAvatarUrl } as any;
            authStore.setLogin(authStore.token, updatedUser);

            wx.showToast({ title: '保存成功', icon: 'success' });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);

        } catch (error) {
            console.error(error);
            wx.showToast({ title: '保存失败', icon: 'none' });
        } finally {
            this.setData({ submitting: false });
        }
    }
});
