// pages/showroom/detail/index.ts
Page({
    data: {
        id: '',
        product: null as unknown as Record<string, any>,
        loading: true
    },

    onLoad(options: any) {
        const id = options.id;
        this.setData({ id });
        this.loadProduct(id);
    },

    goBack() {
        wx.navigateBack();
    },

    loadProduct(id: string) {
        this.setData({ loading: true });
        // Mock Data
        setTimeout(() => {
            this.setData({
                product: {
                    id: id,
                    title: '意大利进口绒布 - 皇家蓝',
                    style: 'Modern Luxury',
                    color: 'Royal Blue',
                    material: 'Velvet / 绒布',
                    craft: 'Imported Weaving',
                    sku: `IT-VEL-${id}`,
                    price: 280,
                    priceInt: '280',
                    image: 'https://picsum.photos/600/800',
                    description: '源自意大利科莫湖畔的纺织工艺，采用顶级长绒棉与真丝混纺。手感如黄油般细腻，色泽饱满深邃，在光线下呈现出流动的奢华质感。适合用于客厅主窗或书房，营造静谧而高贵的空间氛围。'
                },
                loading: false
            });
        }, 500);
    },

    handleContact() {
        wx.makePhoneCall({ phoneNumber: '13800138000' });
    },

    handleAddToQuote() {
        wx.showToast({ title: '已加入报价单', icon: 'success' });
    },

    onShareAppMessage() {
        if (!this.data.product) return {};
        return {
            title: `[藏品] ${this.data.product.title}`,
            path: `/pages/showroom/detail/index?id=${this.data.id}`,
            imageUrl: this.data.product.image
        };
    }
});

export {};
