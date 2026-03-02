/**
 * 客户完工确认页面
 * 场景二：客户在自己的手机上查看师傅上传的完工照片，并签字确认。
 * 由销售/师傅分享链接，客户通过链接进入本页面。
 */
const app = getApp<IAppOption>();
import { getCachedSystemInfo } from '../../../utils/env';

Page({
    data: {
        taskId: '',
        task: null as unknown as Record<string, any>,
        loading: true,
        showSignModal: false,
        signatureWidth: 300,
        signatureHeight: 180,
        submitting: false,
    },

    onLoad(options: any) {
        const { taskId } = options;
        if (!taskId) {
            wx.showToast({ title: '链接参数错误', icon: 'none' });
            return;
        }
        // 使用全局缓存的系统信息（铁律 4.3：避免同步阻塞）
        const sys = getCachedSystemInfo();
        this.setData({
            taskId,
            signatureWidth: sys.windowWidth - 64,
        });
        this.fetchTask(taskId);
    },

    /** 加载任务信息（含完工照片） */
    async fetchTask(taskId: string) {
        this.setData({ loading: true });
        try {
            const res = await app.request(`/mobile/tasks/${taskId}/confirmation-info`);
            if (res.success) {
                this.setData({ task: res.data, loading: false });
            } else {
                throw new Error(res.error || '加载失败');
            }
        } catch (err: any) {
            wx.showToast({ title: err.message || '加载失败', icon: 'none' });
            this.setData({ loading: false });
        }
    },

    /** 打开签字弹窗 */
    openSignModal() {
        this.setData({ showSignModal: true });
    },

    /** 关闭签字弹窗 */
    closeSignModal() {
        if (this.data.submitting) return;
        this.setData({ showSignModal: false });
        setTimeout(() => {
            const sig = this.selectComponent('#customer-signature');
            if (sig) sig.clear();
        }, 300);
    },

    /** 重新签名 */
    handleClear() {
        const sig = this.selectComponent('#customer-signature');
        if (sig) sig.clear();
    },

    /** 预览完工照片 */
    previewPhoto(e: any) {
        const src = e.currentTarget.dataset.src;
        const urls = this.data.task?.photos || [src];
        wx.previewImage({ current: src, urls });
    },

    /** 提交签字确认 */
    async handleConfirm() {
        if (this.data.submitting) return;

        const sig = this.selectComponent('#customer-signature');
        let filePath: string | null = null;
        try {
            filePath = await sig.export();
        } catch (_) { /* ignore */ }

        if (!filePath) {
            wx.showToast({ title: '请先在上方手写签名', icon: 'none' });
            return;
        }

        this.setData({ submitting: true });
        wx.showLoading({ title: '提交中...' });

        try {
            // 上传签名图片
            const signatureUrl = await this.uploadFile(filePath);

            // 调用客户侧完工确认 API
            const res = await app.request(`/mobile/tasks/${this.data.taskId}/confirm`, {
                method: 'POST',
                data: { signatureUrl }
            });

            if (res.success) {
                wx.hideLoading();
                this.setData({ showSignModal: false, submitting: false });
                wx.showToast({ title: '确认成功！', icon: 'success' });
                // 刷新页面状态
                setTimeout(() => this.fetchTask(this.data.taskId), 1500);
            } else {
                throw new Error(res.error || '提交失败');
            }
        } catch (err: any) {
            wx.hideLoading();
            wx.showToast({ title: err.message || '提交失败，请重试', icon: 'none' });
            this.setData({ submitting: false });
        }
    },

    /** 通用文件上传 */
    uploadFile(filePath: string): Promise<string> {
        const apiBase = app.globalData.apiBase;
        const token = wx.getStorageSync('token');
        return new Promise((resolve, reject) => {
            wx.uploadFile({
                url: `${apiBase}/upload`,
                filePath,
                name: 'file',
                header: { 'Authorization': `Bearer ${token}` },
                success: (res) => {
                    try {
                        const data = JSON.parse(res.data);
                        if (data.success) {
                            resolve(data.data?.url || data.url);
                        } else {
                            reject(new Error(data.error || '上传失败'));
                        }
                    } catch (e) { reject(e); }
                },
                fail: reject
            });
        });
    }
});

export { };
