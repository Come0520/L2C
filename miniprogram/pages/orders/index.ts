Page({
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            // Index depends on role, usually 1 for Customer
            this.getTabBar().setData({ selected: 1 });
        }
    }
});
