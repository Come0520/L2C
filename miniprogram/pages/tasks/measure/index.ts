/**
 * 测量数据录入页
 * pages/tasks/measure/index.ts
 */

interface MeasureItem {
    id: string;
    roomName: string;
    windowType: 'STRAIGHT' | 'L_SHAPE' | 'U_SHAPE' | 'ARC';
    width: string;
    height: string;
    installType?: 'TOP' | 'SIDE';
    bracketDist?: string;
    wallMaterial?: 'CONCRETE' | 'WOOD' | 'GYPSUM';
    hasBox?: boolean;
    boxDepth?: string;
    isElectric?: boolean;
    remark?: string;
    expanded?: boolean; // 是否展开
}

Page({
    data: {
        taskId: '',
        currentRound: 1,
        activeVariant: 'A',
        variants: ['A'] as string[],
        items: [] as MeasureItem[],
        photos: [] as string[],
        submitting: false,

        // 枚举选项
        windowTypes: [
            { value: 'STRAIGHT', label: '直窗' },
            { value: 'L_SHAPE', label: 'L型窗' },
            { value: 'U_SHAPE', label: 'U型窗' },
            { value: 'ARC', label: '弧形窗' },
        ],
        installTypes: [
            { value: 'TOP', label: '顶装' },
            { value: 'SIDE', label: '侧装' },
        ],
        wallMaterials: [
            { value: 'CONCRETE', label: '混凝土' },
            { value: 'WOOD', label: '木质' },
            { value: 'GYPSUM', label: '石膏板' },
        ],
    },

    onLoad(options: any) {
        const { taskId } = options;
        if (taskId) {
            this.setData({ taskId });
        }
    },

    /**
     * 添加窗户
     */
    addItem() {
        const newItem: MeasureItem = {
            id: `item_${Date.now()}`,
            roomName: '',
            windowType: 'STRAIGHT',
            width: '',
            height: '',
            expanded: true,
        };
        this.setData({
            items: [...this.data.items, newItem],
        });
    },

    /**
     * 删除窗户
     */
    removeItem(e: any) {
        const { index } = e.currentTarget.dataset;
        const items = this.data.items.filter((_: any, i: number) => i !== index);
        this.setData({ items });
    },

    /**
     * 切换展开/折叠
     */
    toggleExpand(e: any) {
        const { index } = e.currentTarget.dataset;
        const items = [...this.data.items];
        items[index].expanded = !items[index].expanded;
        this.setData({ items });
    },

    /**
     * 切换方案
     */
    switchVariant(e: any) {
        const { variant } = e.currentTarget.dataset;
        this.setData({ activeVariant: variant });
        // TODO: 加载该方案的数据
    },

    /**
     * 新增方案
     */
    addVariant() {
        const nextLetter = String.fromCharCode(65 + this.data.variants.length); // A, B, C...
        this.setData({
            variants: [...this.data.variants, nextLetter],
            activeVariant: nextLetter,
            items: [], // 新方案从空开始
        });
    },

    /**
     * 表单字段变更
     */
    onFieldChange(e: any) {
        const { index, field } = e.currentTarget.dataset;
        const { value } = e.detail;
        const items = [...this.data.items];
        (items[index] as Record<string, any>)[field] = value;
        this.setData({ items });
    },

    /**
     * 选择器变更
     */
    onPickerChange(e: any) {
        const { index, field, options } = e.currentTarget.dataset;
        const pickerIndex = e.detail.value;
        const items = [...this.data.items];
        (items[index] as Record<string, any>)[field] = options[pickerIndex].value;
        this.setData({ items });
    },

    /**
     * 开关变更
     */
    onSwitchChange(e: any) {
        const { index, field } = e.currentTarget.dataset;
        const { value } = e.detail;
        const items = [...this.data.items];
        (items[index] as Record<string, any>)[field] = value;
        this.setData({ items });
    },

    /**
     * 选择照片
     */
    async choosePhoto() {
        try {
            const res = await wx.chooseMedia({
                count: 9 - this.data.photos.length,
                mediaType: ['image'],
                sourceType: ['album', 'camera'],
            });

            this.setData({
                photos: [...this.data.photos, ...res.tempFiles.map(f => f.tempFilePath)],
            });
        } catch (err) {
            console.error('[choosePhoto] Error:', err);
        }
    },

    /**
     * 删除照片
     */
    removePhoto(e: any) {
        const { index } = e.currentTarget.dataset;
        const photos = this.data.photos.filter((_: any, i: number) => i !== index);
        this.setData({ photos });
    },

    /**
     * 提交数据
     */
    async submitData() {
        // 数据验证
        if (this.data.items.length === 0) {
            wx.showToast({ title: '请至少添加一个窗户', icon: 'none' });
            return;
        }

        for (const item of this.data.items) {
            if (!item.roomName || !item.width || !item.height) {
                wx.showToast({ title: '请填写完整的房间名称和尺寸', icon: 'none' });
                return;
            }
        }

        // 确认弹窗
        const confirmed = await new Promise<boolean>((resolve) => {
            wx.showModal({
                title: '确认提交',
                content: `方案 ${this.data.activeVariant}，共 ${this.data.items.length} 个窗户`,
                success: (res) => resolve(res.confirm),
            });
        });

        if (!confirmed) return;

        this.setData({ submitting: true });

        try {
            const app = getApp<IAppOption>();

            // TODO: 上传照片到服务器，获取 URL
            const sitePhotos = this.data.photos; // 实际应上传后返回 URL

            const res = await app.request(`/tasks/${this.data.taskId}/measure-data`, {
                method: 'POST',
                data: {
                    round: this.data.currentRound,
                    variant: this.data.activeVariant,
                    sitePhotos,
                    items: this.data.items.map((item: any) => ({
                        roomName: item.roomName,
                        windowType: item.windowType,
                        width: parseFloat(item.width),
                        height: parseFloat(item.height),
                        installType: item.installType,
                        bracketDist: item.bracketDist ? parseFloat(item.bracketDist) : undefined,
                        wallMaterial: item.wallMaterial,
                        hasBox: item.hasBox,
                        boxDepth: item.boxDepth ? parseFloat(item.boxDepth) : undefined,
                        isElectric: item.isElectric,
                        remark: item.remark,
                    })),
                },
            });

            if (res.success) {
                wx.showToast({ title: '提交成功', icon: 'success' });
                setTimeout(() => {
                    wx.navigateBack();
                }, 1500);
            } else {
                throw new Error(res.error || '提交失败');
            }
        } catch (err: any) {
            console.error('[submitData] Error:', err);
            wx.showToast({ title: err.message || '提交失败', icon: 'none' });
        } finally {
            this.setData({ submitting: false });
        }
    },
});

export { };
