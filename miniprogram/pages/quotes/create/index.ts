import { authStore } from '../../../stores/auth-store';

Page({
    data: {
        customerName: '',
        customerId: '',
        rooms: [] as any[], // { name: '客厅', items: [] }
    },

    onLoad(options: any) {
        if (options.customerId) {
            this.setData({ customerId: options.customerId });
            // TODO: Fetch customer name
        }

        // Add default room
        this.setData({
            rooms: [{ name: '客厅', items: [], id: Date.now() }]
        });
    },

    onAddRoom() {
        const rooms = this.data.rooms;
        const names = ['客厅', '主卧', '次卧', '书房', '阳台', '客卧'];
        const nextName = names[rooms.length % names.length] || '房间';

        rooms.push({
            name: nextName,
            items: [],
            id: Date.now()
        });
        this.setData({ rooms });
    },

    onRemoveRoom(e: any) {
        const index = e.currentTarget.dataset.index;
        const rooms = this.data.rooms;
        rooms.splice(index, 1);
        this.setData({ rooms });
    },

    onRoomNameChange(e: any) {
        const index = e.currentTarget.dataset.index;
        const val = e.detail.value;
        this.setData({ [`rooms[${index}].name`]: val });
    },

    onAddItem(e: any) {
        const roomIndex = e.currentTarget.dataset.index;
        // Navigate to Product Selector, passing roomIndex to know where to return data
        wx.navigateTo({
            url: `/pages/quotes/product-selector/index?roomIndex=${roomIndex}`
        });
    },

    // Callback when returning from Product Selector
    // In MiniProgram we usually update via EventChannel or GlobalData or getCurrentPages()
    // Let's use a method that ProductSelector can call: getOpenerEventChannel
    addProductToRoom(roomIndex: number, product: any) {
        const path = `rooms[${roomIndex}].items`;
        const items = this.data.rooms[roomIndex].items;

        // Default Calculator Logic
        // Mock default dimensions
        const newItem = {
            ...product, // product has id, name, price
            width: 3.5, // m
            height: 2.7, // m
            foldRatio: 2.0,
            quantity: 7.0, // 3.5 * 2
            subtotal: (product.unitPrice * 7).toFixed(2)
        };

        this.setData({
            [path]: [...items, newItem]
        });
    },

    onRemoveItem(e: any) {
        const { roomIndex, itemIndex } = e.currentTarget.dataset;
        const rooms = this.data.rooms;
        rooms[roomIndex].items.splice(itemIndex, 1);
        this.setData({ rooms });
    },

    async onSubmit() {
        // Validate
        if (!this.data.rooms.some(r => r.items.length > 0)) {
            wx.showToast({ title: '请至少添加一个商品', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '创建中...' });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/quotes', {
                method: 'POST',
                data: {
                    customerId: this.data.customerId || null, // Allow Draft without customer? Or Auto-create?
                    // Schema requires customerId. For now let's assume we picked one. 
                    // If empty, maybe error or create dummy?
                    // To keep it simple, require customerId or hardcode one for testing if not provided
                    rooms: this.data.rooms
                }
            });

            if (res.success) {
                wx.showToast({ title: '创建成功', icon: 'success' });
                setTimeout(() => {
                    wx.redirectTo({ url: `/pages/quotes/detail?id=${res.data.id}` });
                }, 1000);
            } else {
                wx.showToast({ title: res.error || '失败', icon: 'none' });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '提交异常', icon: 'none' });
        } finally {
            wx.hideLoading();
        }
    }
});
