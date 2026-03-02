/**
 * L2C 小程序全局配置
 *
 * @description 基于最新四大角色架构设计文档（2026-03-02 已审批）配置。
 * TabBar 5 个槽位：工作台(0) / 线索(1) / 展厅(2) / 任务(3) / 我的(4)
 * 各角色按 ROLE_TABS 常量动态控制可见槽位。
 */
export default defineAppConfig({
    /** 主包页面 */
    pages: [
        // 认证流程
        'pages/landing/index',
        'pages/landing/booking/index', // [NEW] 租户公开预约表单
        'pages/login/index',
        'pages/register/index',
        'pages/status/index',

        // TabBar 页面（必须在主包）
        'pages/workbench/index',     // 槽位 0 — Manager / Sales 工作台
        'pages/leads/index',          // 槽位 1 — Sales 线索
        'pages/showroom/index',       // 槽位 2 — Sales / Customer 展厅
        'pages/tasks/index',          // 槽位 3 — Worker 任务
        'pages/users/profile/index',  // 槽位 4 — 全部角色 我的

        // 主包高频页（快速访问，不需要等待分包下载）
        'pages/leads/detail/index',
        'pages/quotes/index',
        'pages/quotes/create/index',
        'pages/quotes/detail/index',
        'pages/quotes/product-selector/index',
        'pages/crm/index',
        'pages/crm/create/index',
        'pages/crm/detail/index',
        'pages/crm/followup/index',
        'pages/users/edit/index',
        'pages/reports/index',
    ],

    /** 分包配置 */
    subPackages: [
        {
            root: 'pages/leads-sub',
            name: 'leads',
            pages: ['create/index', 'detail/index'],
        },
        {
            root: 'pages/showroom-sub',
            name: 'showroom-sub',
            pages: ['detail/index', 'capsule/index'],
        },
        {
            root: 'pages/service',
            name: 'service',
            pages: ['apply/index', 'list/index'],
        },
        {
            root: 'pages/projects',
            name: 'projects',
            pages: ['task-detail/index'],
        },
        {
            root: 'pages/invite',
            name: 'invite',
            pages: ['index'],
        },
        {
            root: 'pages/manager',
            name: 'manager',
            pages: ['targets/index'],
        },
        {
            root: 'pages/tenant',
            name: 'tenant',
            pages: ['payment-settings/index'],
        },
        {
            root: 'pages/orders',
            name: 'orders',
            pages: ['index', 'detail/index'],
        },
        {
            root: 'pages/tasks-sub',
            name: 'tasks',
            pages: ['detail/index', 'measure/index', 'customer-confirm/index'],
        },
        {
            root: 'pages/workbench-sub',
            name: 'workbench',
            pages: ['engineer/index'],
        },
    ],

    /** 分包预下载 */
    preloadRule: {
        'pages/workbench/index': {
            network: 'all',
            packages: ['orders', 'manager'],
        },
        'pages/leads/index': {
            network: 'wifi',
            packages: ['leads'],
        },
        'pages/tasks/index': {
            network: 'all',
            packages: ['tasks'],
        },
    },

    /** 全局窗口配置 */
    window: {
        navigationBarTitleText: 'L2C 窗帘全流程管理大师',
        navigationBarBackgroundColor: '#F2F2F7', /* Apple Light Gray */
        navigationBarTextStyle: 'black',
        backgroundColor: '#F2F2F7',
        backgroundTextStyle: 'dark',
        initialRenderingCache: 'static',
    },

    /**
     * 自定义 TabBar（5 槽位）
     *
     * 实际显示由 src/components/TabBar/index.tsx 根据 ROLE_TABS 动态控制。
     * 列表顺序必须与 ROLE_TABS 中的槽位索引严格对应：
     * 0=工作台, 1=线索, 2=展厅, 3=任务, 4=我的
     */
    tabBar: {
        custom: true,
        color: '#8E8E93',
        selectedColor: '#007AFF', /* Apple Blue */
        borderStyle: 'white',
        backgroundColor: '#F2F2F7',
        list: [
            { pagePath: 'pages/workbench/index', text: '工作台' },
            { pagePath: 'pages/leads/index', text: '线索' },
            { pagePath: 'pages/showroom/index', text: '展厅' },
            { pagePath: 'pages/tasks/index', text: '任务' },
            { pagePath: 'pages/users/profile/index', text: '我的' },
        ],
    },
})
