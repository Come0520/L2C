/**
 * 官网落地页 - 硬编码数据常量（V1 MVP）
 * 后续 V2 将替换为 CMS 后台动态数据
 */

// ======================== 第 1 幕：运营轮播 ========================
export interface CarouselItem {
    id: string;
    title: string;
    subtitle: string;
    cta?: { text: string; href: string };
    bgGradient?: string;
}

export const heroCarouselItems: CarouselItem[] = [
    {
        id: 'welcome',
        title: '让窗帘生意，回归简单',
        subtitle:
            '我们是一群来自家居行业的从业者。见过太多门店老板被 Excel、微信群和手写单据困住。所以我们做了 L2C —— 从线索到收款，一站式管理。',
        cta: { text: '免费开始', href: '/register' },
        bgGradient: 'from-blue-50 to-indigo-50',
    },
    {
        id: 'feature-update',
        title: '全新云展厅上线',
        subtitle: '你的每件产品，都有一个不下班的销售员。客户 24 小时随时浏览，自主选品更高效。',
        cta: { text: '了解更多', href: '#showroom' },
        bgGradient: 'from-purple-50 to-pink-50',
    },
    {
        id: 'free-forever',
        title: '基础版永久免费',
        subtitle: '不限用户数、核心功能全开放、无隐藏费用。让改变从今天开始。',
        cta: { text: '立即注册', href: '/register' },
        bgGradient: 'from-emerald-50 to-teal-50',
    },
];

// ======================== 第 2 幕：痛点弹幕 ========================
export interface DanmakuItem {
    id: string;
    /** 痛点分类 */
    category: string;
    /** 痛点文案 */
    pain: string;
    /** 解决方案描述 */
    solution: string;
}

export const danmakuItems: DanmakuItem[] = [
    {
        id: 'quote-1',
        category: '报价',
        pain: '客户要报价，手算了 2 小时还算错了',
        solution: 'L2C 智能报价引擎，从选品、算价到出报价单，5 分钟全部搞定，自动计算零出错。',
    },
    {
        id: 'quote-2',
        category: '报价',
        pain: '报价单格式不统一，客户觉得不专业',
        solution: '系统自动生成统一品牌模板的精美报价单，可在线分享给客户，专业度拉满。',
    },
    {
        id: 'quote-3',
        category: '报价',
        pain: '改一个窗帘尺寸，整张报价单要重做',
        solution: '尺寸变更自动联动重算，产品库价格实时同步，改一处，全局自动更新。',
    },
    {
        id: 'order-1',
        category: '跟单',
        pain: '订单跟着跟着...... 就跟丢了',
        solution: '全流程订单看板，每一笔订单当前状态一目了然，到期自动提醒，永不丢单。',
    },
    {
        id: 'order-2',
        category: '跟单',
        pain: '客户打电话问进度，我也不知道',
        solution: '订单进度实时追踪，从下单到安装每一步透明可见，客户来问直接截图回复。',
    },
    {
        id: 'order-3',
        category: '跟单',
        pain: '哪个订单该发货了？翻了 20 条微信记录',
        solution: '智能发货提醒 + 待办任务清单，系统自动排期，再也不用翻聊天记录。',
    },
    {
        id: 'measure-1',
        category: '测量',
        pain: '测量师到了现场不知道要测哪些窗户',
        solution: '订单自动生成测量任务单，包含客户地址、窗户清单、特殊要求。打开手机即可查看。',
    },
    {
        id: 'measure-2',
        category: '测量',
        pain: '测量数据写在纸上，回来就找不到了',
        solution: '手机端直接录入测量数据，实时回传到系统，数据永久保存不丢失。',
    },
    {
        id: 'finance-1',
        category: '财务',
        pain: '供应商对账每月耗 3 天',
        solution: '采购单自动关联付款记录，对账一键生成报表，3 天的工作缩短到 30 分钟。',
    },
    {
        id: 'finance-2',
        category: '财务',
        pain: '老板要数据，全靠 Excel 手动统计',
        solution: '数据驾驶舱实时汇总销售、财务、团队数据，打开手机随时查看，告别手工统计。',
    },
    {
        id: 'finance-3',
        category: '财务',
        pain: '哪个项目赚了哪个亏了？说不清楚',
        solution: '每笔订单自动核算成本与利润，多维度报表清晰呈现每单盈亏。',
    },
    {
        id: 'manage-1',
        category: '管理',
        pain: '安装排期全靠微信群喊',
        solution: '安装任务从订单自动生成，在线排期、指派技师、签收确认，全流程数字化。',
    },
    {
        id: 'manage-2',
        category: '管理',
        pain: '新员工来了，培训一个月才能上手',
        solution: '标准化流程内置于系统中，新人跟着步骤走即可上手，培训周期大幅缩短。',
    },
    {
        id: 'manage-3',
        category: '管理',
        pain: '三个销售同时跟了一个客户，谁都不知道',
        solution: '线索自动分配 + 客户归属锁定，杜绝撞单问题，每条线索都有专属负责人。',
    },
    {
        id: 'leads-1',
        category: '获客',
        pain: '展厅没人来，线上不知道怎么推广',
        solution: '云展厅 24 小时在线，客户扫码即看全部产品，线上线下双引擎获客。',
    },
    {
        id: 'leads-2',
        category: '获客',
        pain: '客户加了微信就再也没回过消息',
        solution: '智能跟进提醒，客户 N 天未互动自动推送提醒，再也不放过任何一条线索。',
    },
    {
        id: 'collab-1',
        category: '协作',
        pain: '设计师、测量师、安装师信息不同步',
        solution: '统一工作台，所有角色共享同一套订单数据，实时同步无缝协作。',
    },
    {
        id: 'collab-2',
        category: '协作',
        pain: '图纸传来传去搞不清哪个是最新版',
        solution: '文件集中管理 + 版本控制，永远只有一个最新版本，杜绝版本混乱。',
    },
    {
        id: 'supply-1',
        category: '供应链',
        pain: '布料到了才发现颜色不对',
        solution: '采购单自动关联订单细节，面料型号、颜色编号原样传递，从源头减少出错。',
    },
    {
        id: 'supply-2',
        category: '供应链',
        pain: '采购下单手抄订单信息，经常出错',
        solution: '订单确认后自动生成采购任务，信息零人工转录，准确率 100%。',
    },
];

// ======================== 第 4 幕：功能亮点 ========================
export interface FeatureItem {
    id: string;
    title: string;
    tagline: string;
    description: string;
    icon: string; // Lucide 图标名称
}

export const featureItems: FeatureItem[] = [
    {
        id: 'crm',
        title: '再也不丢客户',
        tagline: '客户来了就跑不掉，每一条线索自动有人跟',
        description:
            '多渠道线索自动归集、智能分配给合适的销售、到期未跟自动提醒。',
        icon: 'Users',
    },
    {
        id: 'quote',
        title: '5 分钟出一份专业报价',
        tagline: '选面料、算价格、改尺寸，一键搞定',
        description:
            '产品库自动联动价格、改尺寸自动重算、生成精美报价单在线分享。',
        icon: 'FileText',
    },
    {
        id: 'order',
        title: '订单确认，采购自动跑',
        tagline: '客户签了字，采购单秒级生成，供应商立刻收到',
        description:
            '订单自动拆分为采购任务、匹配供应商、采购进度实时追踪。',
        icon: 'Package',
    },
    {
        id: 'measure',
        title: '测量师到场，心里有数',
        tagline: '打开手机就知道量哪几扇窗、有什么特殊要求',
        description:
            '测量任务自动从订单生成、包含窗户清单和备注、现场填报即时回传。',
        icon: 'Ruler',
    },
    {
        id: 'dashboard',
        title: '打开手机，生意一目了然',
        tagline: '今天签了几单、回了多少款、哪个销售最猛',
        description:
            '销售漏斗、业绩排行、财务概览、团队效率，老板随时随地掌控全局。',
        icon: 'BarChart3',
    },
];

// ======================== 第 5 幕：客户认可 ========================
export interface StatItem {
    label: string;
    value: number;
    suffix: string;
}

export const trustStats: StatItem[] = [
    { label: '服务企业', value: 200, suffix: '+' },
    { label: '管理报价单', value: 50000, suffix: '+' },
    { label: '覆盖城市', value: 30, suffix: '+' },
];

export interface TestimonialItem {
    id: string;
    content: string;
    author: string;
    role: string;
    company: string;
}

export const testimonialItems: TestimonialItem[] = [
    {
        id: 't1',
        content:
            '用了 L2C 之后，报价效率提升了至少 3 倍，客户也觉得我们更专业了。',
        author: '张经理',
        role: '店长',
        company: '城东窗帘旗舰店',
    },
    {
        id: 't2',
        content:
            '以前最头疼的就是订单跟踪，现在打开手机一目了然，再也没丢过单。',
        author: '李总',
        role: '总经理',
        company: '锦绣家居',
    },
    {
        id: 't3',
        content:
            '最惊喜的是居然免费！功能比我们之前用的付费软件还全面，果断全店切换。',
        author: '王姐',
        role: '创始人',
        company: '品致窗饰',
    },
];

// ======================== 第 7 幕：定价方案 ========================
export interface PricingFeature {
    text: string;
    included: boolean;
}

export interface PricingPlan {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: PricingFeature[];
    cta: { text: string; href: string };
    highlighted?: boolean;
}

export const pricingPlans: PricingPlan[] = [
    {
        id: 'free',
        name: '基础版',
        price: '¥0',
        period: '永久免费',
        description: '适合中小门店，核心功能全面开放',
        features: [
            { text: '不限用户数', included: true },
            { text: 'CRM 客户管理', included: true },
            { text: '智能报价系统', included: true },
            { text: '订单与供应链管理', included: true },
            { text: '云展厅', included: true },
            { text: '数据驾驶舱', included: true },
            { text: '移动端适配', included: true },
            { text: '无隐藏费用', included: true },
        ],
        cta: { text: '立即免费注册', href: '/register' },
        highlighted: true,
    },
    {
        id: 'enterprise',
        name: '企业版',
        price: '即将推出',
        period: '',
        description: '适合连锁品牌，高级定制功能',
        features: [
            { text: '包含基础版所有功能', included: true },
            { text: '多门店管理', included: true },
            { text: '高级数据分析', included: true },
            { text: '自定义审批流程', included: true },
            { text: 'API 对接', included: true },
            { text: '专属客户成功经理', included: true },
        ],
        cta: { text: '联系我们', href: '#contact' },
        highlighted: false,
    },
];

// ======================== 导航链接 ========================
export const navLinks = [
    { label: '功能介绍', href: '#features' },
    { label: '解决方案', href: '#pain-points' },
    { label: '客户案例', href: '#testimonials' },
    { label: '价格体系', href: '#pricing' },
];
