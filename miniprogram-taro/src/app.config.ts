/**
 * L2C 小程序全局配置
 *
 * @description 基于最新四大角色架构设计文档（2026-03-04 已审批）配置。
 * TabBar 5 个槽位：工作台(0) / 线索(1) / 展厅(2) / 任务(3) / 我的(4)
 * 各角色按 ROLE_TABS 常量动态控制可见槽位。
 *
 * 分包架构：
 *   packageCustomer — 客户全生命周期
 *   packageWorker   — 工人现场作业
 *   packageSales    — 销售轻量移动端
 *   packageShowroom — 云展厅（共享）
 */
export default defineAppConfig({
    /** 主包页面（严格 < 2MB） */
    pages: [
        // 认证流程
        'pages/landing/index',
        'pages/landing/booking/index',
        'pages/login/index',
        'pages/register/index',
        'pages/status/index',

        // TabBar 页面（必须在主包）
        'pages/workbench/index',      // 槽位 0 — Manager / Sales 工作台
        'pages/leads/index',           // 槽位 1 — Sales 线索列表
        'pages/showroom/index',        // 槽位 2 — Sales / Customer 展厅首页
        'pages/tasks/index',           // 槽位 3 — Worker 任务列表
        'pages/users/profile/index',   // 槽位 4 — 全部角色 我的

        // 主包轻量页
        'pages/users/edit/index',
    ],

    /** 分包配置 — 按角色划分 */
    subPackages: [
        {
            root: 'packageCustomer',
            name: 'customer',
            pages: [
                'quote-view/index',     // 报价查看（客户视角）
                'quote-sign/index',     // 电子签字
                'order-track/index',    // 订单进度跟踪 - P2 待建
                'acceptance/index',     // 安装验收 - P2 待建
                'review/index',         // 评价 - P2 待建
                'after-sales/index',    // 报修 - MIGRATED
                'service-list/index',   // 服务记录 - MIGRATED
                'refer-share/index',    // 转介绍分享 - P1 高优
                'refer-landing/index',  // 品牌落地页 - P1 高优
            ],
        },
        {
            root: 'packageWorker',
            name: 'worker',
            pages: [
                'onboarding/index',       // 入驻培训 - P3 待建
                'order-bid/index',        // 接单/议价 - P3 待建
                'schedule/index',         // 日历视图 - P3 待建
                'task-detail/index',      // 任务详情 - MIGRATED
                'measure/index',          // 量尺 - MIGRATED
                'measure-dispute/index',  // 量尺异议 - P3 待建
                'install-upload/index',   // 安装回传 - P3 待建
                'settlement/index',       // 结算面板 - P3 待建
                'liability/index',        // 售后判责 - P3 待建
                'customer-confirm/index', // 客户现场确认 - MIGRATED
                'engineer/index',         // 工程师工作台 - MIGRATED
                'storage-quota/index',    // 我的存储 - MIGRATED
                // 'check-in/index',         // 打卡 - 已有骨架
                // 'photo-upload/index',     // 拍照上传 - 已有骨架
            ],
        },
        {
            root: 'packageSales',
            name: 'sales',
            pages: [
                'lead-detail/index',      // 线索详情 - MIGRATED
                'lead-actions/index',     // 线索操作 - P4 待建
                'quick-follow-up/index',  // 快速跟进 - P4 待建
                'share-hub/index',        // 分享中心 - P4 待建
                'measure-review/index',   // 量尺审查 - P4 待建
                'orders/index',           // 订单列表 - MIGRATED
                'orders/detail/index',    // 订单详情 - MIGRATED
                'invite/index',           // 邀请 - MIGRATED
                'ai-rendering/index',     // AI 效果图向导 - Task 7
                'ai-rendering/gallery',   // AI 效果图库 - Task 8
            ],
        },
        {
            root: 'packageShowroom',
            name: 'showroom',
            pages: [
                'product-detail/index',   // 商品详情 - MIGRATED
                'case-detail/index',      // 案例详情 - P1 待建
                'article-detail/index',   // 知识文章 - P1 待建
                'favorites/index',        // 我的收藏 - P1 待建
                'capsule/index',          // 分享胶囊 - MIGRATED
                'collection/index',       // 精选合集 - MIGRATED
            ],
        },
    ],

    /** 分包预下载 */
    preloadRule: {
        'pages/workbench/index': {
            network: 'all',
            packages: ['sales', 'worker'],
        },
        'pages/leads/index': {
            network: 'wifi',
            packages: ['sales'],
        },
        'pages/tasks/index': {
            network: 'all',
            packages: ['worker'],
        },
        'pages/showroom/index': {
            network: 'all',
            packages: ['showroom', 'customer'],
        },
    },

    /** 全局窗口配置 */
    window: {
        navigationBarTitleText: 'L2C 窗帘全流程管理大师',
        navigationBarBackgroundColor: '#F2F2F7',
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
        selectedColor: '#007AFF',
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
