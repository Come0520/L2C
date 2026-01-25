import { authStore } from '../stores/auth-store';

Component({
    data: {
        selected: 0,
        color: "#909399",
        selectedColor: "#E6B450",
        list: []
    },

    lifetimes: {
        attached() {
            // Subscribe to store updates
            this.unsubscribe = authStore.subscribe(() => {
                this.updateTabs();
            });
            // Initial update
            this.updateTabs();
        },
        detached() {
            if (this.unsubscribe) this.unsubscribe();
        }
    },

    methods: {
        switchTab(e: any) {
            const data = e.currentTarget.dataset;
            const url = data.path;

            wx.switchTab({ url });

            // Update local state is optional as switchTab re-inits page, 
            // but modifying global selected index might be needed if custom-tab-bar is not re-created
            this.setData({
                selected: data.index
            });
        },

        updateTabs() {
            const role = authStore.currentRole;
            let list: any[] = [];

            // 1. Boss (Admin) - Full Access
            const adminTabs = [
                { pagePath: "/pages/workbench/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/crm/index", text: "线索", iconPath: "/assets/tabbar/leads.svg", selectedIconPath: "/assets/tabbar/leads-active.svg" },
                { pagePath: "/pages/orders/index", text: "订单", iconPath: "/assets/tabbar/order.svg", selectedIconPath: "/assets/tabbar/order-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 2. Sales - Private Data
            const salesTabs = [
                { pagePath: "/pages/workbench/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/crm/index", text: "线索", iconPath: "/assets/tabbar/leads.svg", selectedIconPath: "/assets/tabbar/leads-active.svg" },
                { pagePath: "/pages/orders/index", text: "订单", iconPath: "/assets/tabbar/order.svg", selectedIconPath: "/assets/tabbar/order-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 3. Installer - Tasks Only
            const installerTabs = [
                { pagePath: "/pages/tasks/index", text: "任务", iconPath: "/assets/tabbar/task.svg", selectedIconPath: "/assets/tabbar/task-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 4. Customer - Shopping/Service
            const customerTabs = [
                { pagePath: "/pages/index/index", text: "首页", iconPath: "/assets/tabbar/home.svg", selectedIconPath: "/assets/tabbar/home-active.svg" },
                { pagePath: "/pages/quotes/index", text: "报价", iconPath: "/assets/tabbar/quote.svg", selectedIconPath: "/assets/tabbar/quote-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // Default/Guest View
            const guestTabs = [
                { pagePath: "/pages/index/index", text: "首页" },
                { pagePath: "/pages/users/profile", text: "登录" }
            ];

            switch (role) {
                case 'admin':
                    list = adminTabs;
                    break;
                case 'sales':
                    list = salesTabs;
                    break;
                case 'installer':
                    list = installerTabs;
                    break;
                case 'customer':
                    list = customerTabs;
                    break;
                default:
                    list = guestTabs; // Force Guest view for unrecognized roles
            }

            this.setData({ list });
        }
    }
});
