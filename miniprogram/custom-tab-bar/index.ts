import { authStore } from '../stores/auth-store';

interface TabBarData {
    selected: number;
    color: string;
    selectedColor: string;
    list: {
        pagePath: string;
        text: string;
        iconPath?: string;
        selectedIconPath?: string;
    }[];
}

Component({
    data: {
        selected: 0,
        color: "#6B7280",
        selectedColor: "#2563EB",
        list: [] as TabBarData['list']
    },

    lifetimes: {
        attached() {
            // Subscribe to store updates
            (this as any).unsubscribe = authStore.subscribe(() => {
                this.updateTabs();
            });
            // Initial update
            this.updateTabs();
        },
        detached() {
            if ((this as any).unsubscribe) (this as any).unsubscribe();
        }
    },

    methods: {
        switchTab(e: any) {
            const data = e.currentTarget.dataset;
            const url = data.path;
            // 官方最佳实践：所有 tab 页均在主包并在 tabBar.list 中注册，直接用 wx.switchTab
            wx.switchTab({ url });
            // 立即更新选中状态，提升视觉反馈
            this.setData({ selected: data.index });
        },

        updateTabs() {
            const role = authStore.currentRole;
            console.log('[CustomTabBar] Updating tabs for role:', role);

            let list: any[] = [];

            // 1. Boss (Admin) - 所有路径均为主包 tabBar.list 中的路径
            const adminTabs = [
                { pagePath: "/pages/workbench/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/leads/index", text: "线索", iconPath: "/assets/tabbar/leads.svg", selectedIconPath: "/assets/tabbar/leads-active.svg" },
                { pagePath: "/pages/quotes/index", text: "报价", iconPath: "/assets/tabbar/quote.svg", selectedIconPath: "/assets/tabbar/quote-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 2. Sales
            const salesTabs = [
                { pagePath: "/pages/workbench/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/leads/index", text: "线索", iconPath: "/assets/tabbar/leads.svg", selectedIconPath: "/assets/tabbar/leads-active.svg" },
                { pagePath: "/pages/quotes/index", text: "报价", iconPath: "/assets/tabbar/quote.svg", selectedIconPath: "/assets/tabbar/quote-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 3. Installer
            const installerTabs = [
                { pagePath: "/pages/tasks/index", text: "任务", iconPath: "/assets/tabbar/task.svg", selectedIconPath: "/assets/tabbar/task-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 4. Customer
            const customerTabs = [
                { pagePath: "/pages/index/index", text: "首页", iconPath: "/assets/tabbar/home.svg", selectedIconPath: "/assets/tabbar/home-active.svg" },
                { pagePath: "/pages/quotes/index", text: "报价", iconPath: "/assets/tabbar/quote.svg", selectedIconPath: "/assets/tabbar/quote-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // Default/Guest View
            const guestTabs = [
                { pagePath: "/pages/index/index", text: "首页", iconPath: "/assets/tabbar/home.svg", selectedIconPath: "/assets/tabbar/home-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // Role Normalized Check
            // The role from backend might be UPPERCASE or lowercase, normalize it.
            const normalizedRole = role ? role.toLowerCase() : 'guest';

            if (normalizedRole === 'admin' || normalizedRole === 'boss') {
                list = adminTabs;
            } else if (normalizedRole === 'sales') {
                list = salesTabs;
            } else if (normalizedRole === 'installer') {
                list = installerTabs;
            } else if (normalizedRole === 'customer') {
                list = customerTabs;
            } else {
                list = guestTabs;
            }

            this.setData({ list });
        }
    }
});

export { };
