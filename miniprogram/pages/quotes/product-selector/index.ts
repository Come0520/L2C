Page({
    data: {
        roomIndex: -1,
        products: [] as Record<string, any>[],
        loading: false,
        keyword: ''
    },

    onLoad(options: any) {
        if (options.roomIndex) {
            this.setData({ roomIndex: parseInt(options.roomIndex) });
        }
        this.fetchProducts();
    },

    async fetchProducts() {
        this.setData({ loading: true });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/products', {
                data: { keyword: this.data.keyword }
            });
            if (res.success) {
                this.setData({ products: res.data });
            }
        } catch (err) {
            console.error(err);
        } finally {
            this.setData({ loading: false });
        }
    },

    onSearchInput(e: any) {
        this.setData({ keyword: e.detail.value });
    },

    onSearch() {
        this.fetchProducts();
    },

    onProductSelect(e: any) {
        const product = e.currentTarget.dataset.product;
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];

        if (prevPage && typeof prevPage.addProductToRoom === 'function') {
            prevPage.addProductToRoom(this.data.roomIndex, product);
            wx.navigateBack();
        } else {
            wx.showToast({ title: '无法返回数据', icon: 'none' });
        }
    }
});

export {};
