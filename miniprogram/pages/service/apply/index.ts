import { IAppOption } from "../../../app";

Page({
    data: {
        orderId: '',
        orderNo: '',
        type: 'REPAIR',
        description: '',
        photos: [] as string[],
        submitting: false
    },

    onLoad(options: any) {
        if (options.orderId) {
            this.setData({
                orderId: options.orderId,
                orderNo: options.orderNo || '已关联订单' // Ideally pass OrderNo or fetch it
            });
        }
    },

    onTypeSelect(e: any) {
        this.setData({ type: e.currentTarget.dataset.type });
    },

    onInputDesc(e: any) {
        this.setData({ description: e.detail.value });
    },

    onSelectOrder() {
        wx.navigateTo({
            url: '/pages/orders/index?mode=select' // Assuming order list supports select mode
        });
    },

    chooseImage() {
        const that = this;
        wx.chooseMedia({
            count: 9 - this.data.photos.length,
            mediaType: ['image'],
            success(res) {
                that.uploadFiles(res.tempFiles);
            }
        });
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
                        header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` },
                        success(res) {
                            const data = JSON.parse(res.data);
                            if (data.url) resolve(data.url);
                            else reject();
                        },
                        fail: reject
                    })
                });
            });

            const urls = await Promise.all(uploadPromises);
            this.setData({ photos: [...this.data.photos, ...urls] });

        } catch (e) {
            wx.showToast({ title: '上传失败', icon: 'none' });
        } finally {
            wx.hideLoading();
        }
    },

    deletePhoto(e: any) {
        const { index } = e.currentTarget.dataset;
        const photos = this.data.photos;
        photos.splice(index, 1);
        this.setData({ photos });
    },

    async onSubmit() {
        if (!this.data.orderId) {
            return wx.showToast({ title: '请选择关联订单', icon: 'none' });
        }
        if (!this.data.description) {
            return wx.showToast({ title: '请填写问题描述', icon: 'none' });
        }

        this.setData({ submitting: true });
        const app = getApp<IAppOption>();

        try {
            const res = await app.request('/service/tickets', {
                orderId: this.data.orderId,
                type: this.data.type,
                description: this.data.description,
                photos: this.data.photos
            }, 'POST');

            if (res.success) {
                wx.showToast({ title: '提交成功' });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            } else {
                wx.showToast({ title: res.error || '提交失败', icon: 'none' });
            }
        } catch (e) {
            console.error(e);
            wx.showToast({ title: '提交出错', icon: 'none' });
        } finally {
            this.setData({ submitting: false });
        }
    }
});
