const app = getApp();
import { formatTime } from '../../../utils/util';
Page({
    data: {
        id: '',
        type: '',
        task: null,
        loading: true,
        error: '',
        statusText: '',
        statusType: 'primary', // primary, success, warning, danger
        scheduledTime: '',
    },
    onLoad(options) {
        if (options.id && options.type) {
            this.setData({
                id: options.id,
                type: options.type
            });
            this.fetchTaskDetail();
        }
        else {
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
            }
            else {
                throw new Error(res.error || '获取详情失败');
            }
        }
        catch (err) {
            this.setData({
                loading: false,
                error: err.message || '网络请求失败'
            });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    processTaskData(task) {
        let statusText = '';
        let statusType = 'primary';
        const status = task.status;
        // Status Mapping
        if (status === 'PENDING' || status === 'PENDING_DISPATCH') {
            statusText = '待接单';
            statusType = 'warning';
        }
        else if (status === 'SCHEDULED' || status === 'ASSIGNED') {
            statusText = '待上门';
            statusType = 'primary';
        }
        else if (status === 'IN_PROGRESS') {
            statusText = '进行中';
            statusType = 'primary';
        }
        else if (status === 'COMPLETED') {
            statusText = '已完成';
            statusType = 'success';
        }
        // Time Formatting
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
    makePhoneCall(e) {
        const phone = e.currentTarget.dataset.phone;
        if (phone) {
            wx.makePhoneCall({ phoneNumber: phone });
        }
    },
    // 打开地图导航
    openLocation() {
        // Note: In real app, addresses need geocoding to lat/lng. 
        // Here we assume checking in logic gets location, but for navigation we might fetch user input address.
        // Simulating simple toast for now as geocoding requires mapping API key.
        wx.showToast({ title: '打开地图导航...', icon: 'none' });
    },
    // 更新状态
    async updateStatus(e) {
        const status = e.currentTarget.dataset.status;
        // const action = e.currentTarget.dataset.action;
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
                this.fetchTaskDetail(); // Refresh
            }
            else {
                throw new Error(res.error);
            }
        }
        catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    checkIn() {
        // Implement check-in logic (get location)
        wx.getLocation({
            type: 'gcj02',
            success: (res) => {
                console.log('Location:', res);
                this.updateStatus({ currentTarget: { dataset: { status: 'IN_PROGRESS' } } });
            },
            fail: () => {
                wx.showToast({ title: '获取定位失败', icon: 'none' });
            }
        });
    },
    completeTask() {
        // Navigate to completion form or confirm
        wx.showModal({
            title: '完成任务',
            content: '确认任务已完成吗？',
            success: (res) => {
                if (res.confirm) {
                    this.updateStatus({ currentTarget: { dataset: { status: 'COMPLETED' } } });
                }
            }
        });
    }
});
