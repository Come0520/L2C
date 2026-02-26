/**
 * 任务列表页
 * pages/tasks/index.ts
 */
Page({
    data: {
        activeTab: 'pending', // 'pending' | 'completed'
        taskList: [],
        loading: false,
        refreshing: false,
    },
    onLoad() {
        this.fetchTasks();
    },
    onShow() {
        // 设置 TabBar 选中状态
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 0 });
        }
        // 刷新任务列表
        this.fetchTasks();
    },
    /**
     * 获取任务列表
     */
    async fetchTasks() {
        this.setData({ loading: true });
        try {
            const app = getApp();
            const statusParam = this.data.activeTab === 'pending'
                ? 'PENDING_VISIT,PENDING_CONFIRM'
                : 'COMPLETED';
            const res = await app.request(`/tasks?type=measure&status=${statusParam}`);
            if (res.success) {
                this.setData({
                    taskList: res.data.measureTasks || [],
                    loading: false,
                });
            }
            else {
                throw new Error(res.error || '获取任务列表失败');
            }
        }
        catch (err) {
            console.error('[fetchTasks] Error:', err);
            wx.showToast({
                title: err.message || '加载失败',
                icon: 'none',
            });
            this.setData({ loading: false });
        }
    },
    /**
     * Tab 切换
     */
    onTabChange(e) {
        const tab = e.currentTarget.dataset.tab;
        if (tab !== this.data.activeTab) {
            this.setData({ activeTab: tab });
            this.fetchTasks();
        }
    },
    /**
     * 下拉刷新
     */
    async onPullDownRefresh() {
        this.setData({ refreshing: true });
        await this.fetchTasks();
        this.setData({ refreshing: false });
        wx.stopPullDownRefresh();
    },
    /**
     * 跳转到任务详情
     */
    goToDetail(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/tasks/detail/detail?id=${id}&type=measure`,
        });
    },
    /**
     * 格式化状态文本
     */
    formatStatus(status) {
        const statusMap = {
            'PENDING': '待分配',
            'PENDING_VISIT': '待上门',
            'PENDING_CONFIRM': '待确认',
            'COMPLETED': '已完成',
            'REJECTED': '已驳回',
        };
        return statusMap[status] || status;
    },
    /**
     * 格式化测量类型
     */
    formatMeasureType(type) {
        return type === 'QUOTE_BASED' ? '带方案' : '盲测';
    },
    /**
     * 格式化时间
     */
    formatTime(dateStr) {
        if (!dateStr)
            return '--';
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${month}月${day}日 ${hour}:${minute}`;
    },
});
export {};
