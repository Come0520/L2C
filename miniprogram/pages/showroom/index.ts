const app = getApp<IAppOption>();

Page({
    data: {
        activeTab: 'featured',
        searchQuery: '',
        resources: [] as Record<string, any>[],
        loading: false,

        // Selection Mode
        isSelectionMode: false,
        selectedIds: [] as string[],
        selectedCount: 0,

        // Filter State
        isFilterOpen: false,
        activeFilters: { style: '', material: '', color: '' },

        // Mock Data
        mockData: {
            featured: [
                { id: 1, type: 'case', title: '西湖壹号 - 现代极简', image: 'https://picsum.photos/400/600', tag: 'Top Case' },
                { id: 1, type: 'case', title: '西湖壹号 - 现代极简', image: 'https://picsum.photos/400/600', tag: 'Top Case', style: '现代简约', color: '中性色' },
                { id: 2, type: 'product', title: '意大利进口绒布 - 皇家蓝', image: 'https://picsum.photos/400/500', tag: 'Hot', material: '绒布', color: '冷色' },
                { id: 3, type: 'case', title: '阳光海岸 - 法式浪漫', image: 'https://picsum.photos/400/550', tag: 'New', style: '法式浪漫', color: '暖色' }
            ],
            products: [
                { id: 2, type: 'product', title: '意大利进口绒布 - 皇家蓝', image: 'https://picsum.photos/400/500', price: '¥280/m', material: '绒布', color: '冷色' },
                { id: 4, type: 'product', title: '高精密遮光布 - 奶咖色', image: 'https://picsum.photos/400/400', price: '¥120/m', material: '高精密', color: '中性色' },
                { id: 5, type: 'product', title: '土耳其纱帘 - 梦幻白', image: 'https://picsum.photos/400/520', price: '¥98/m', material: '纱帘', color: '中性色' }
            ],
            cases: [
                { id: 1, type: 'case', title: '西湖壹号 - 现代极简', image: 'https://picsum.photos/400/600', views: 1205, style: '现代简约', color: '中性色' },
                { id: 3, type: 'case', title: '阳光海岸 - 法式浪漫', image: 'https://picsum.photos/400/550', views: 890, style: '法式浪漫', color: '暖色' },
                { id: 6, type: 'case', title: '华润悦府 - 中式禅意', image: 'https://picsum.photos/400/480', views: 560, style: '中式禅意', color: '暖色' }
            ]
        }
    },

    onLoad() {
        this.loadResources('featured');
    },

    onTabChange(e: any) {
        const tab = e.currentTarget.dataset.tab;
        if (tab === this.data.activeTab) return;
        this.setData({ activeTab: tab });
        this.loadResources(tab);
    },

    loadResources(tab: string) {
        this.setData({ loading: true });
        // Restore selection state
        const selectedIds = this.data.selectedIds;
        const filters = this.data.activeFilters;

        setTimeout(() => {
            const rawData = (this.data.mockData as Record<string, any>)[tab] || [];

            // Apply Filtering
            const filteredData = rawData.filter((item: any) => {
                // If filter is set, check if item matches. Item might store these as single string or array.
                // For MVP Mock, simple check.
                if (filters.style && item.style !== filters.style) return false;
                if (filters.material && item.material !== filters.material) return false;
                if (filters.color && item.color !== filters.color) return false;
                return true;
            });

            const data = filteredData.map((item: any) => ({
                ...item,
                selected: selectedIds.includes(String(item.id))
            }));

            this.setData({
                resources: data,
                loading: false
            });
        }, 300);
    },

    onSearchInput(e: any) {
        this.setData({ searchQuery: e.detail.value });
    },

    /**
     * Filter Actions
     */
    toggleFilter() {
        this.setData({ isFilterOpen: !this.data.isFilterOpen });
    },

    selectFilterOption(e: any) {
        const { key, value } = e.currentTarget.dataset;
        const currentVal = (this.data.activeFilters as Record<string, any>)[key];
        const newVal = currentVal === value ? '' : value; // Toggle

        this.setData({
            [`activeFilters.${key}`]: newVal
        });
    },

    resetFilter() {
        this.setData({
            activeFilters: { style: '', material: '', color: '' }
        });
        this.loadResources(this.data.activeTab); // Reload
    },

    confirmFilter() {
        this.toggleFilter(); // Close drawer
        this.loadResources(this.data.activeTab); // Apply
    },

    /**
     * Toggle Selection Mode
     */
    toggleSelectionMode() {
        const isSelectionMode = !this.data.isSelectionMode;
        this.setData({ isSelectionMode });

        if (!isSelectionMode) {
            // Clear selection when exiting? Or keep it?
            // User might want to cancel selection. Let's clear for now.
            this.setData({ selectedIds: [], selectedCount: 0 });
            this.updateResourceSelection([]);
        }
    },

    /**
     * Handle Card Tap
     */
    onResourceTap(e: any) {
        const id = String(e.currentTarget.dataset.id);

        if (this.data.isSelectionMode) {
            this.toggleResourceSelection(id);
        } else {
            wx.navigateTo({ url: `/pages/showroom/detail/index?id=${id}` });
        }
    },

    toggleResourceSelection(id: string) {
        let selectedIds = [...this.data.selectedIds];
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter(item => item !== id);
        } else {
            selectedIds.push(id);
        }

        this.setData({
            selectedIds,
            selectedCount: selectedIds.length
        });

        this.updateResourceSelection(selectedIds);
    },

    updateResourceSelection(selectedIds: string[]) {
        const resources = this.data.resources.map((item: any) => ({
            ...item,
            selected: selectedIds.includes(String(item.id))
        }));
        this.setData({ resources });
    },

    /**
     * Share Capsule
     */
    onShareAppMessage() {
        const ids = this.data.selectedIds.join(',');
        const title = '为您精选的窗帘搭配方案';

        return {
            title,
            path: `/pages/showroom/capsule/index?ids=${ids}`,
            imageUrl: '/assets/share-cover.png' // Or dynamic canvas
        };
    }
});
