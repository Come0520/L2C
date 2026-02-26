/**
 * 快速开单页面
 * 
 * 功能：
 * 1. 从配置加载房间类型
 * 2. 添加/删除房间
 * 3. 添加商品并自动计算价格
 * 4. 选择客户
 * 5. 生成报价单
 */
import { authStore } from '../../../stores/auth-store';
import { throttleTap } from '../../../utils/throttle-tap';

interface RoomType {
    key: string;
    label: string;
}

interface QuoteItem {
    id: string;
    name: string;
    unitPrice: number;
    unit: string;
    width: number;
    height: number;
    foldRatio: number;
    quantity: number;
    subtotal: number;
    calcType?: string;
}

interface Room {
    id: number;
    name: string;
    items: QuoteItem[];
}

Page({
    data: {
        // 客户信息
        customerName: '',
        customerId: '',

        // 房间配置
        roomTypes: [] as RoomType[],
        rooms: [] as Room[],

        // 状态
        loading: true,
        totalAmount: 0,

        // 房间选择弹窗
        showRoomPicker: false,

        // 尺寸编辑弹窗
        showDimensionEditor: false,
        editingItem: null as {
            roomIndex: number;
            itemIndex: number;
            name: string;
            width: number;
            height: number;
            foldRatio: number;
            unitPrice: number;
            calcType: string;
        } | null,
        previewQuantity: 0,
        previewSubtotal: 0,
        foldRatioOptions: [1.5, 2.0, 2.5],
    },

    async onLoad(options: Record<string, string | undefined>) {
        // 如果传入了客户ID
        if (options.customerId) {
            this.setData({
                customerId: options.customerId,
                customerName: options.customerName || ''
            });
        }

        // 加载配置
        await this.fetchConfig();
    },

    /**
     * 获取配置（房间类型等）
     */
    async fetchConfig() {
        this.setData({ loading: true });

        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/config');

            if (res.success) {
                const { roomTypes = [], defaultRooms = ['客厅', '主卧'] } = res.data;

                // 初始化默认房间
                const rooms: Room[] = defaultRooms.map((name: string, i: number) => ({
                    id: Date.now() + i,
                    name,
                    items: []
                }));

                this.setData({
                    roomTypes,
                    rooms,
                    loading: false
                });
            } else {
                // 使用兜底配置
                this.useDefaultConfig();
            }
        } catch (err) {
            console.error('Fetch config failed:', err);
            this.useDefaultConfig();
        }
    },

    /**
     * 兜底配置
     */
    useDefaultConfig() {
        const defaultRoomTypes: RoomType[] = [
            { key: 'LIVING_ROOM', label: '客厅' },
            { key: 'MASTER_BEDROOM', label: '主卧' },
            { key: 'SECOND_BEDROOM', label: '次卧' },
            { key: 'STUDY', label: '书房' },
            { key: 'BALCONY', label: '阳台' },
        ];

        this.setData({
            roomTypes: defaultRoomTypes,
            rooms: [
                { id: Date.now(), name: '客厅', items: [] },
                { id: Date.now() + 1, name: '主卧', items: [] }
            ],
            loading: false
        });
    },

    /**
     * 显示房间选择器
     */
    onShowRoomPicker() {
        this.setData({ showRoomPicker: true });
    },

    /**
     * 选择房间类型
     */
    onSelectRoomType(e: WechatMiniprogram.TouchEvent) {
        const { label } = e.currentTarget.dataset;
        const rooms = this.data.rooms;

        rooms.push({
            id: Date.now(),
            name: label,
            items: []
        });

        this.setData({
            rooms,
            showRoomPicker: false
        });
    },

    /**
     * 取消房间选择
     */
    onCancelRoomPicker() {
        this.setData({ showRoomPicker: false });
    },

    /**
     * 删除房间
     */
    onRemoveRoom(e: WechatMiniprogram.TouchEvent) {
        const index = e.currentTarget.dataset.index as number;
        const rooms = this.data.rooms;
        rooms.splice(index, 1);
        this.setData({ rooms });
        this.calculateTotal();
    },

    /**
     * 修改房间名称
     */
    onRoomNameChange(e: WechatMiniprogram.Input) {
        const index = e.currentTarget.dataset.index as number;
        const val = e.detail.value;
        this.setData({ [`rooms[${index}].name`]: val });
    },

    /**
     * 添加商品（跳转到商品选择器）
     */
    onAddItem(e: WechatMiniprogram.TouchEvent) {
        const roomIndex = e.currentTarget.dataset.index as number;
        wx.navigateTo({
            url: `/pages/quotes/product-selector/index?roomIndex=${roomIndex}`
        });
    },

    /**
     * 接收商品选择器回调，添加商品到房间
     * 商品选择器会调用此方法
     */
    async addProductToRoom(roomIndex: number, product: Record<string, unknown>) {
        // 默认尺寸，稍后用户可编辑
        const width = 3.0;
        const height = 2.7;
        const foldRatio = 2.0;

        // 调用计算接口
        const app = getApp<IAppOption>();
        const unitPrice = parseFloat(product.unitPrice as string) || 0;

        let quantity = width * foldRatio;
        let subtotal = quantity * unitPrice;

        // 尝试调用计算 API
        try {
            const calcRes = await app.request('/calculate', {
                method: 'POST',
                data: {
                    productId: product.id,
                    width,
                    height,
                    foldRatio,
                    calcType: product.calcType || 'CURTAIN',
                    unitPrice,
                    fabricWidth: product.fabricWidth || 2.8
                }
            });

            if (calcRes.success) {
                quantity = calcRes.data.quantity;
                subtotal = calcRes.data.subtotal;
            }
        } catch (err) {
            console.warn('Calculate API failed, using simple calc:', err);
        }

        const newItem: QuoteItem = {
            id: product.id as string,
            name: product.name as string,
            unitPrice,
            unit: product.unit as string || '米',
            width,
            height,
            foldRatio,
            quantity,
            subtotal,
            calcType: product.calcType as string
        };

        const path = `rooms[${roomIndex}].items`;
        const items = this.data.rooms[roomIndex].items;

        this.setData({
            [path]: [...items, newItem]
        });

        this.calculateTotal();
    },

    /**
     * 删除商品
     */
    onRemoveItem(e: WechatMiniprogram.TouchEvent) {
        const { roomIndex, itemIndex } = e.currentTarget.dataset as { roomIndex: number; itemIndex: number };
        const rooms = this.data.rooms;
        rooms[roomIndex].items.splice(itemIndex, 1);
        this.setData({ rooms });
        this.calculateTotal();
    },

    /**
     * 编辑商品尺寸 - 打开编辑弹窗
     */
    onEditItemDimension(e: WechatMiniprogram.TouchEvent) {
        const { roomIndex, itemIndex } = e.currentTarget.dataset as { roomIndex: number; itemIndex: number };
        const item = this.data.rooms[roomIndex].items[itemIndex];

        this.setData({
            showDimensionEditor: true,
            editingItem: {
                roomIndex,
                itemIndex,
                name: item.name,
                width: item.width,
                height: item.height,
                foldRatio: item.foldRatio,
                unitPrice: item.unitPrice,
                calcType: item.calcType || 'CURTAIN'
            },
            previewQuantity: item.quantity,
            previewSubtotal: item.subtotal
        });
    },

    /**
     * 尺寸输入变化
     */
    onDimensionInput(e: WechatMiniprogram.Input) {
        const field = e.currentTarget.dataset.field as 'width' | 'height';
        const value = parseFloat(e.detail.value) || 0;

        if (!this.data.editingItem) return;

        this.setData({
            [`editingItem.${field}`]: value
        });

        // 更新预览
        this.updateDimensionPreview();
    },

    /**
     * 选择褶皱倍数
     */
    onSelectFoldRatio(e: WechatMiniprogram.TouchEvent) {
        const ratio = e.currentTarget.dataset.ratio as number;

        if (!this.data.editingItem) return;

        this.setData({
            'editingItem.foldRatio': ratio
        });

        this.updateDimensionPreview();
    },

    /**
     * 更新尺寸预览（本地计算）
     */
    updateDimensionPreview() {
        const item = this.data.editingItem;
        if (!item) return;

        const { width, height, foldRatio, unitPrice, calcType } = item;

        let quantity = 0;
        const fabricWidth = 2.8; // 默认门幅

        switch (calcType) {
            case 'CURTAIN':
                // 幅数 * (高度 + 余量)
                const totalWidth = width * foldRatio;
                const panels = Math.ceil(totalWidth / fabricWidth);
                quantity = panels * (height + 0.2);
                break;
            case 'LINEAR':
                quantity = width + 0.2;
                break;
            case 'FIXED':
                quantity = 1;
                break;
            default:
                quantity = width * foldRatio;
        }

        quantity = Math.round(quantity * 100) / 100;
        const subtotal = Math.round(quantity * unitPrice * 100) / 100;

        this.setData({
            previewQuantity: quantity,
            previewSubtotal: subtotal
        });
    },

    /**
     * 确认尺寸修改
     */
    onConfirmDimension() {
        const item = this.data.editingItem;
        if (!item) return;

        const { roomIndex, itemIndex, width, height, foldRatio } = item;

        // 验证输入
        if (width <= 0 || height <= 0) {
            wx.showToast({ title: '请输入有效尺寸', icon: 'none' });
            return;
        }

        // 更新商品数据
        const path = `rooms[${roomIndex}].items[${itemIndex}]`;
        this.setData({
            [`${path}.width`]: width,
            [`${path}.height`]: height,
            [`${path}.foldRatio`]: foldRatio,
            [`${path}.quantity`]: this.data.previewQuantity,
            [`${path}.subtotal`]: this.data.previewSubtotal,
            showDimensionEditor: false,
            editingItem: null
        });

        this.calculateTotal();
        wx.showToast({ title: '已更新', icon: 'success' });
    },

    /**
     * 取消尺寸编辑
     */
    onCancelDimensionEdit() {
        this.setData({
            showDimensionEditor: false,
            editingItem: null
        });
    },

    /**
     * 计算总价
     */
    calculateTotal() {
        let total = 0;
        for (const room of this.data.rooms) {
            for (const item of room.items) {
                total += item.subtotal || 0;
            }
        }
        this.setData({ totalAmount: Math.round(total * 100) / 100 });
    },

    /**
     * 选择客户
     */
    async onSelectCustomer() {
        wx.showLoading({ title: '加载客户...' });

        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/customers');
            wx.hideLoading();

            if (!res.success || !res.data?.length) {
                // 没有客户时直接新建
                this.onCreateCustomer();
                return;
            }

            const customers = res.data as Array<{ id: string; name: string }>;
            const customerNames = [...customers.map(c => c.name), '+ 新建客户'];

            wx.showActionSheet({
                itemList: customerNames,
                success: (result) => {
                    if (result.tapIndex === customers.length) {
                        this.onCreateCustomer();
                    } else {
                        const selected = customers[result.tapIndex];
                        this.setData({
                            customerId: selected.id,
                            customerName: selected.name
                        });
                        wx.showToast({ title: `已选择: ${selected.name}`, icon: 'success' });
                    }
                }
            });
        } catch (err) {
            wx.hideLoading();
            console.error('Fetch customers failed:', err);
            // 降级到手动输入
            this.onCreateCustomer();
        }
    },

    /**
     * 新建客户
     */
    onCreateCustomer() {
        wx.showModal({
            title: '新建客户',
            editable: true,
            placeholderText: '请输入客户姓名',
            success: async (res) => {
                if (res.confirm && res.content) {
                    const name = res.content.trim();
                    if (!name) return;

                    wx.showLoading({ title: '创建中...' });
                    try {
                        const app = getApp<IAppOption>();
                        const createRes = await app.request('/customers', {
                            method: 'POST',
                            data: { name }
                        });
                        wx.hideLoading();

                        if (createRes.success) {
                            this.setData({
                                customerId: createRes.data.id,
                                customerName: createRes.data.name
                            });
                            wx.showToast({ title: `已创建: ${name}`, icon: 'success' });
                        } else {
                            wx.showToast({ title: createRes.error || '创建失败', icon: 'none' });
                        }
                    } catch (err) {
                        wx.hideLoading();
                        console.error('Create customer failed:', err);
                        // 降级：使用临时 ID
                        this.setData({
                            customerId: 'temp-' + Date.now(),
                            customerName: name
                        });
                        wx.showToast({ title: `已添加: ${name}`, icon: 'success' });
                    }
                }
            }
        });
    },

    /**
     * 提交报价单
     */
    onSubmit: throttleTap(async function (this: any) {
        // 验证
        if (!this.data.customerId) {
            wx.showToast({ title: '请先选择客户', icon: 'none' });
            return;
        }

        if (!this.data.rooms.some((r: any) => r.items.length > 0)) {
            wx.showToast({ title: '请至少添加一个商品', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '创建中...' });
        try {
            const app = getApp<IAppOption>();

            // 开发模式检测
            if (authStore.token?.startsWith('dev-mock-token-')) {
                wx.hideLoading();
                wx.showToast({ title: '开发模式：模拟创建成功', icon: 'success' });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
                return;
            }

            const res = await app.request('/quotes', {
                method: 'POST',
                data: {
                    customerId: this.data.customerId,
                    rooms: this.data.rooms
                }
            });

            if (res.success) {
                wx.showToast({ title: '创建成功', icon: 'success' });
                setTimeout(() => {
                    wx.redirectTo({ url: `/pages/quotes/detail?id=${res.data.id}` });
                }, 1000);
            } else {
                wx.showToast({ title: res.error || '创建失败', icon: 'none' });
            }
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '提交异常', icon: 'none' });
        } finally {
            wx.hideLoading();
        }
    })
});

export { };
