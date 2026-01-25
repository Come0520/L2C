Page({
    data: {
        curator: {
            name: '金牌顾问',
            avatarUrl: ''
        },
        items: [] as any[]
    },

    onLoad(options: any) {
        // Parse IDs from URL
        const ids = options.ids ? options.ids.split(',') : [];
        if (ids.length > 0) {
            this.fetchCapsuleItems(ids);
        }

        // Use curator info if passed, or default
        if (options.curatorName) {
            this.setData({
                'curator.name': options.curatorName
            });
        }
    },

    /**
     * Fetch Items (Mock)
     * In real app, call API with IDs
     */
    fetchCapsuleItems(ids: string[]) {
        // Mock Global Data Pool (Same as Showroom for demo)
        const allItems = [
            { id: 1, type: 'case', title: '西湖壹号 - 现代极简', image: 'https://picsum.photos/400/600', desc: '采用高精密遮光布，完美适配落地窗，营造静谧睡眠环境。' },
            { id: 2, type: 'product', title: '意大利进口绒布 - 皇家蓝', image: 'https://picsum.photos/400/500', desc: '手感细腻，垂感极佳，轻奢风格首选。' },
            { id: 3, type: 'case', title: '阳光海岸 - 法式浪漫', image: 'https://picsum.photos/400/550', desc: '透光不透人的土耳其纱帘，让阳光变得温柔。' },
            { id: 4, type: 'product', title: '高精密遮光布 - 奶咖色', image: 'https://picsum.photos/400/400', desc: '百搭暖色调，提升空间温馨感。' },
            { id: 5, type: 'product', title: '土耳其纱帘 - 梦幻白', image: 'https://picsum.photos/400/520', desc: '仙气十足，自带滤镜效果。' },
            { id: 6, type: 'case', title: '华润悦府 - 中式禅意', image: 'https://picsum.photos/400/480', desc: '棉麻质感，回归自然本真。' }
        ];

        const selectedItems = allItems.filter(item => ids.includes(String(item.id)));
        this.setData({ items: selectedItems });
    },

    /**
     * Preview Image
     */
    previewImage(e: any) {
        const current = e.currentTarget.dataset.src;
        wx.previewImage({
            current,
            urls: this.data.items.map(item => item.image)
        });
    },

    onShareAppMessage() {
        return {
            title: '为您定制的灵感方案',
            path: this.route
        }
    }
});
