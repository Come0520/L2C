/**
 * 小程序开发环境模拟数据中心
 *
 * 用于在本地开发环境 / 测试虚拟用户场景下，返回静态数据，
 * 避免在路由文件内大量混杂 mock 分支逻辑。
 */

/** 判断是否为开发环境虚拟测试用户 */
export function isDevMockUser(userId: string, tenantId: string): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    (userId === 'dev-virtual-user' || tenantId === 'dev-tenant')
  );
}

// ==========================
// Dashboard 模块 Mock 数据
// ==========================
export const MOCK_DASHBOARD = {
  role: 'sales',
  target: { amount: 100000, achieved: 35000, percentage: 35 },
  stats: {
    leads: 12,
    leadsBreakdown: { pending: 3, following: 6, won: 3 },
    quotes: 8,
    orders: 3,
    cash: '35.0',
    conversionRate: '25.0',
    avgOrderValue: '11667',
  },
  todos: [
    {
      id: 'dev-1',
      title: 'DEV-Q2026001',
      status: 'DRAFT',
      desc: '客户: 张女士（测试）',
      time: new Date().toLocaleDateString(),
    },
    {
      id: 'dev-2',
      title: 'DEV-Q2026002',
      status: 'ORDERED',
      desc: '客户: 李先生（测试）',
      time: new Date().toLocaleDateString(),
    },
  ],
  // Manager 角色额外显示字段
  pendingApprovals: 2,
  monthRevenue: 35000,
  newLeads: 5,
  notifications: ['欢迎使用 DEV 模式工作台'],
  reminders: ['今日有 2 条待跟进线索'],
};

// ==========================
// Leads 模块 Mock 数据
// ==========================
export const MOCK_LEADS = [
  {
    id: 'dev-lead-1',
    leadNo: 'L2026030001',
    customerName: '张女士',
    customerPhone: '138****8001',
    community: '碧桂园·翡翠湾',
    houseType: '三室两厅',
    intentionLevel: 'HIGH',
    status: 'FOLLOWING_UP',
    createdAt: new Date().toISOString(),
    sourceChannel: { name: '门店自然进店' },
    sourceSub: null,
    assignedSales: { name: 'DEV·销售' },
  },
  {
    id: 'dev-lead-2',
    leadNo: 'L2026030002',
    customerName: '李先生',
    customerPhone: '139****6002',
    community: '万科·城市花园',
    houseType: '两室一厅',
    intentionLevel: 'MEDIUM',
    status: 'PENDING_FOLLOWUP',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sourceChannel: { name: '朋友推荐' },
    sourceSub: null,
    assignedSales: { name: 'DEV·销售' },
  },
  {
    id: 'dev-lead-3',
    leadNo: 'L2026030003',
    customerName: '王先生',
    customerPhone: '136****3003',
    community: '恒大·御景半岛',
    houseType: '别墅',
    intentionLevel: 'HIGH',
    status: 'QUOTED',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    sourceChannel: { name: '抖音推广' },
    sourceSub: null,
    assignedSales: { name: 'DEV·销售' },
  },
  {
    id: 'dev-lead-4',
    leadNo: 'L2026030004',
    customerName: '赵女士',
    customerPhone: '158****4004',
    community: '星河湾',
    houseType: '四室两厅',
    intentionLevel: 'LOW',
    status: 'PENDING_ASSIGNMENT',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    sourceChannel: { name: '小红书' },
    sourceSub: null,
    assignedSales: null,
  },
  {
    id: 'dev-lead-5',
    leadNo: 'L2026030005',
    customerName: '陈先生',
    customerPhone: '186****5005',
    community: '保利·天悦',
    houseType: '复式',
    intentionLevel: 'HIGH',
    status: 'MEASUREMENT_SCHEDULED',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    sourceChannel: { name: '老客户转介绍' },
    sourceSub: null,
    assignedSales: { name: 'DEV·销售' },
  },
];
