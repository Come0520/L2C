
const app = getApp<IAppOption>();
import { formatTime } from '../../../utils/util';

Page({
    data: {
        id: '',
        type: '',
        task: null as unknown as Record<string, any>,
        loading: true,
        error: '',
        statusText: '',
        statusType: 'primary',
        scheduledTime: '',
        // 完工弹窗相关
        showCompleteModal: false,
        submitting: false,
        uploadedPhotos: [] as string[],
        completeRemark: '',
        signatureWidth: 300,
    },

    onLoad(options: any) {
        if (options.id && options.type) {
            const sys = wx.getSystemInfoSync();
            this.setData({
                id: options.id,
                type: options.type,
                signatureWidth: sys.windowWidth - 80,
            });
            this.fetchTaskDetail();
        } else {
            this.setData({ error: '参数错误', loading: false });
        }
    },

    async fetchTaskDetail() {
        this.setData({ loading: true, error: '' });
        try {
            const res = await app.request(`/tasks/${this.data.id}?type=${this.data.type}`);
            if (res.success) {
                const task = res.data;
                this.processTaskData(task);
            } else {
                throw new Error(res.error || '获取详情失败');
            }
        } catch (err: any) {
            this.setData({
                loading: false,
                error: err.message || '网络请求失败'
            });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },

    processTaskData(task: any) {
        let statusText = '';
        let statusType = 'primary';
        const status = task.status;

        // 状态中文映射
        if (status === 'PENDING' || status === 'PENDING_DISPATCH') {
            statusText = '待接单';
            statusType = 'warning';
        } else if (status === 'SCHEDULED' || status === 'ASSIGNED') {
            statusText = '待上门';
            statusType = 'primary';
        } else if (status === 'IN_PROGRESS') {
            statusText = '进行中';
            statusType = 'primary';
        } else if (status === 'COMPLETED') {
            statusText = '已完成';
            statusType = 'success';
        }

        // 时间格式化
        const time = task.scheduledAt || task.scheduledDate;
        const scheduledTime = time ? formatTime(new Date(time)) : '未预约';

        this.setData({
            task,
            loading: false,
            statusText,
            statusType,
            scheduledTime
        });
    },

    // 拨打电话
    makePhoneCall(e: any) {
        const phone = e.currentTarget.dataset.phone;
        if (phone) {
            wx.makePhoneCall({ phoneNumber: phone });
        }
    },

    // 打开地图
    openLocation() {
        wx.showToast({ title: '打开地图导航...', icon: 'none' });
    },

    // 预览照片
    previewPhoto(e: any) {
        const src = e.currentTarget.dataset.src;
        const urls = this.data.task?.photos || [src];
        wx.previewImage({ current: src, urls });
    },

    // 接单/签到/其他状态更新
    async updateStatus(e: any) {
        const status = e.currentTarget.dataset.status;
        wx.showLoading({ title: '处理中...' });
        try {
            const res = await app.request(`/tasks/${this.data.id}`, {
                method: 'POST',
                data: {
                    type: this.data.type,
                    action: 'update_status',
                    data: { status }
                }
            });

            if (res.success) {
                wx.showToast({ title: '操作成功', icon: 'success' });
                this.fetchTaskDetail();
            } else {
                throw new Error(res.error);
            }
        } catch (err: any) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
        } finally {
            wx.hideLoading();
        }
    },

    checkIn() {
        wx.getLocation({
            type: 'gcj02',
            success: () => {
                this.updateStatus({ currentTarget: { dataset: { status: 'IN_PROGRESS' } } });
            },
            fail: () => {
                wx.showToast({ title: '获取定位失败', icon: 'none' });
            }
        });
    },

    // ===========================
    // 完工确认弹窗逻辑
    // ===========================

    /** 打开完工确认弹窗 */
    openCompleteModal() {
        this.setData({
            showCompleteModal: true,
            uploadedPhotos: [],
            completeRemark: '',
        });
    },

    /** 关闭完工确认弹窗 */
    closeCompleteModal() {
        if (this.data.submitting) return;
        this.setData({ showCompleteModal: false });
    },

    /** 备注输入 */
    onRemarkInput(e: any) {
        this.setData({ completeRemark: e.detail.value });
    },

    /** 选择现场照片（最多6张） */
    pickPhoto() {
        const { uploadedPhotos } = this.data;
        const remain = 6 - uploadedPhotos.length;
        wx.chooseMedia({
            count: remain,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const newPaths = res.tempFiles.map((f: any) => f.tempFilePath);
                // 先本地预览，提交时再上传
                this.setData({ uploadedPhotos: [...uploadedPhotos, ...newPaths] });
            }
        });
    },

    /** 重新签名 */
    handleTaskSignClear() {
        const signature = this.selectComponent('#task-signature');
        if (signature) signature.clear();
    },

    /** 提交完工（含签名 + 照片上传） */
    async submitComplete() {
        if (this.data.submitting) return;

        const signature = this.selectComponent('#task-signature');

        // 获取签名图片路径
        let signaturePath: string | null = null;
        try {
            signaturePath = await signature.export();
        } catch (_) { /* ignore */ }

        if (!signaturePath) {
            wx.showToast({ title: '请让客户在上方签名后再提交', icon: 'none' });
            return;
        }

        this.setData({ submitting: true });
        wx.showLoading({ title: '正在提交完工...' });

        try {
            // 1. 上传签名
            const signatureUrl = await this.uploadFile(signaturePath);

            // 2. 上传现场照片（并行）
            const photoUrls: string[] = [];
            if (this.data.uploadedPhotos.length > 0) {
                const uploadTasks = this.data.uploadedPhotos.map((p: string) => this.uploadFile(p));
                const results = await Promise.all(uploadTasks);
                results.forEach(r => {
                    if (r && r.url) photoUrls.push(r.url);
                });
            }

            // 3. 提交完工请求
            const taskId = this.data.id;
            const res = await app.request(`/engineer/tasks/${taskId}/complete`, {
                method: 'POST',
                data: {
                    signatureUrl,
                    photos: photoUrls,
                    remark: this.data.completeRemark,
                }
            });

            if (res.success) {
                wx.hideLoading();
                this.setData({ showCompleteModal: false, submitting: false });
                wx.showToast({ title: '完工提交成功', icon: 'success' });
                setTimeout(() => this.fetchTaskDetail(), 1500);
            } else {
                throw new Error(res.error || '提交失败');
            }
        } catch (err: any) {
            wx.hideLoading();
            wx.showToast({ title: err.message || '提交失败，请重试', icon: 'none' });
            this.setData({ submitting: false });
        }
    },

    /**
     * 通用文件上传（返回 URL）
     */
    uploadFile(filePath: string): Promise<any> {
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
     * 当任务处于待确认状态时，分享卡片跳转到客户确认页（customer-confirm），
     * 客户可在该页查看完工照片并签字确认。其他状态则分享任务基本信息。
     */
    onShareAppMessage() {
        const task = this.data.task;
        const isPendingConfirm = task?.status === 'PENDING_CONFIRM';
        if (isPendingConfirm) {
            return {
                title: `【安装完工】${task?.taskNo || ''} — 请查看完工照片并签字确认`,
                path: `/pages/tasks/customer-confirm/index?taskId=${this.data.id}`,
            };
        }
        return {
            title: `安装任务 ${task?.taskNo || ''}`,
            path: `/pages/tasks/detail/detail?id=${this.data.id}&type=${this.data.type}`,
        };
    },
});

export { };
