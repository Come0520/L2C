import { authStore } from '../stores/auth-store';

/**
 * 自定义 TabBar 数据结构
 */
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
            // 订阅 authStore 变化，角色切换时自动刷新 Tab 列表
            (this as any).unsubscribe = authStore.subscribe(() => {
                this.updateTabs();
            });
            // 初始化
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
            // 官方最佳实践：所有 tab 页面均在主包并已注册至 tabBar.list，使用 wx.switchTab
            wx.switchTab({ url });
            // 立即更新选中状态，提升视觉反馈速度
            this.setData({ selected: data.index });
        },

        updateTabs() {
            const role = authStore.currentRole;
            console.log('[CustomTabBar] 刷新 Tab 配置，当前角色:', role);

            // =====================================================
            // 各角色 Tab 列表配置
            // 注意：所有 pagePath 必须在 app.json 的 tabBar.list 中注册
            // =====================================================

            // 1. 老板 / 管理员：工作台（报表+KPI）+ 我的
            const bossAdminTabs = [
                { pagePath: "/pages/index/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 2. 经理：工作台（团队概览+待审批）+ 线索 + 我的
            const managerTabs = [
                { pagePath: "/pages/index/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/leads/index", text: "线索", iconPath: "/assets/tabbar/leads.svg", selectedIconPath: "/assets/tabbar/leads-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 3. 销售：线索（核心）+ 工作台（报价/订单快捷入口）+ 我的
            const salesTabs = [
                { pagePath: "/pages/leads/index", text: "线索", iconPath: "/assets/tabbar/leads.svg", selectedIconPath: "/assets/tabbar/leads-active.svg" },
                { pagePath: "/pages/index/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 4. 工人（原 installer）：任务（接单+打卡）+ 工作台（收益概览）+ 我的
            const workerTabs = [
                { pagePath: "/pages/tasks/index", text: "任务", iconPath: "/assets/tabbar/task.svg", selectedIconPath: "/assets/tabbar/task-active.svg" },
                { pagePath: "/pages/index/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 6. 客户：主页（顾问+待签字+展厅入口）+ 我的（保修/评价）
            const customerTabs = [
                { pagePath: "/pages/index/index", text: "主页", iconPath: "/assets/tabbar/home.svg", selectedIconPath: "/assets/tabbar/home-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 7. 测试员：拥有全量核心菜单（用于免登查看）
            const testerTabs = [
                { pagePath: "/pages/index/index", text: "工作台", iconPath: "/assets/tabbar/work.svg", selectedIconPath: "/assets/tabbar/work-active.svg" },
                { pagePath: "/pages/leads/index", text: "线索", iconPath: "/assets/tabbar/leads.svg", selectedIconPath: "/assets/tabbar/leads-active.svg" },
                { pagePath: "/pages/tasks/index", text: "任务", iconPath: "/assets/tabbar/task.svg", selectedIconPath: "/assets/tabbar/task-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 8. 游客/未登录：仅主页 + 我的
            const guestTabs = [
                { pagePath: "/pages/index/index", text: "主页", iconPath: "/assets/tabbar/home.svg", selectedIconPath: "/assets/tabbar/home-active.svg" },
                { pagePath: "/pages/users/profile", text: "我的", iconPath: "/assets/tabbar/profile.svg", selectedIconPath: "/assets/tabbar/profile-active.svg" }
            ];

            // 将角色代码统一为小写，兼容后端大写/小写格式
            const normalizedRole = role ? role.toLowerCase() : 'guest';

            let list: any[];
            if (normalizedRole === 'boss' || normalizedRole === 'admin') {
                list = bossAdminTabs;
            } else if (normalizedRole === 'manager') {
                list = managerTabs;
            } else if (normalizedRole === 'sales') {
                list = salesTabs;
            } else if (normalizedRole === 'worker' || normalizedRole === 'installer') {
                // installer 是旧角色代码，兼容处理，统一映射到 workerTabs
                list = workerTabs;
            } else if (normalizedRole === 'customer') {
                list = customerTabs;
            } else if (normalizedRole === 'tester') {
                list = testerTabs;
            } else {
                list = guestTabs;
            }

            this.setData({ list });
        }
    }
});

export { };
