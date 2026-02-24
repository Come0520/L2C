import { IAppOption } from "../../../app";
import { formatTime } from "../../../utils/util";

Page({
    data: {
        id: '',
        task: null,
        loading: false,
        statusMap: {
            'PENDING_DISPATCH': '待派单',
            'PENDING_ACCEPT': '待接单',
            'IN_PROGRESS': '施工中',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
        } as Record<string, string>
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: options.id });
            this.fetchDetail(options.id);
        }
    },

    async fetchDetail(id: string) {
        const app = getApp<IAppOption>();
        const res = await app.request('/engineer/tasks', {}, 'GET'); // Reuse list API ? No, need detail
        // Wait, I didn't create Detail API for engineer. 
        // But list API returns items? Let's check route.ts.
        // The list API route currently fetches details denormalized or not?
        // Let's implement a simple filter on client side if API returns everything or Update API.
        // Actually, for simplicity, I should create a detail API or just use the list API and find the item if list is small.
        // Or better, let's just make a specific detail API.

        // For now, let's assume list API params support ID or just filter client side for MVP since user only sees THEIR tasks.
        if (res.success) {
            const task = (res.data || []).find((t: any) => t.id === id);
            if (task) {
                task.scheduledDateFormatted = task.scheduledDate ? formatTime(new Date(task.scheduledDate)).split(' ')[0] : '';
                // Need to fetch items? The list API currently doesn't fetch items relation.
                // I need to update the task-detail page logic or the list API.
                // Let's add with: { items: true } to the list API for now as it's easier.
                this.setData({ task });
            }
        }
    },

    makePhoneCall(e: any) {
        const { phone } = e.currentTarget.dataset;
        if (phone) wx.makePhoneCall({ phoneNumber: phone });
    },

    onComplete() {
        const that = this;
        wx.chooseMedia({
            count: 9,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success(res) {
                const tempFiles = res.tempFiles;
                that.uploadFiles(tempFiles);
            }
        })
    },

    async uploadFiles(files: any[]) {
        const app = getApp<IAppOption>();
        wx.showLoading({ title: '上传中...' });

        try {
            const uploadPromises = files.map(file => {
                return new Promise<string>((resolve, reject) => {
                    wx.uploadFile({
                        url: `${app.globalData.baseUrl}/api/miniprogram/upload`,
                        filePath: file.tempFilePath,
                        name: 'file',
                        header: {
                            'Authorization': `Bearer ${wx.getStorageSync('token')}`
                        },
                        success(res) {
                            const data = JSON.parse(res.data);
                            if (data.url) resolve(data.url);
                            else reject('Upload failed');
                        },
                        fail: reject
                    })
                });
            });

            const urls = await Promise.all(uploadPromises);
            this.submitCompletion(urls);

        } catch (e) {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
        }
    },

    async submitCompletion(photos: string[]) {
        const app = getApp<IAppOption>();
        const res = await app.request(`/engineer/tasks/${this.data.id}/complete`, {
            photos,
            remark: 'Completed by Engineer'
        }, 'POST');

        wx.hideLoading();
        if (res.success) {
            wx.showToast({ title: '任务完成', icon: 'success' });
            setTimeout(() => {
                wx.navigateBack();
            }, 1000);
        } else {
            wx.showToast({ title: res.error || '提交失败', icon: 'none' });
        }
    }
});

export {};
