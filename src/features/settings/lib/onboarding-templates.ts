/**
 * Onboarding 模版定义（精确人数匹配版）
 *
 * 每个人数（1/2/3/4/5/6-10/11+）都有专属模版，角色人头数严格对应。
 */

// ============ 类型定义 ============

/** 人数选项值 */
export type TeamSizeValue = 1 | 2 | 3 | 4 | 5 | 6 | 11;

/** 模版标识 */
export type ProfileTemplate = string;

/** 预设角色定义（带人头数） */
export interface PresetRole {
  /** 角色名 */
  name: string;
  /** 角色描述 */
  description: string;
  /** 该角色几个人 */
  count: number;
  /** 是否为 BOSS 角色 */
  isBoss?: boolean;
}

/** 模版完整定义 */
export interface TemplateDefinition {
  /** 模版标识 */
  id: ProfileTemplate;
  /** 展示名称 */
  name: string;
  /** 图标标识（emoji） */
  icon: string;
  /** 一句话描述 */
  tagline: string;
  /** 详细描述 */
  description: string;
  /** 预设角色列表 */
  roles: PresetRole[];
  /** 核心特征清单 */
  features: string[];
}

/** 人数选项 UI 数据 */
export interface SizeOption {
  value: TeamSizeValue;
  label: string;
  icon: string;
  desc: string;
  /** 是否为单人模式（不需要邀请） */
  isSolo: boolean;
}

// ============ 人数选项 ============

export const SIZE_OPTIONS: SizeOption[] = [
  { value: 1, label: '1 人', icon: '🦸', desc: '我一个人包打天下', isSolo: true },
  { value: 2, label: '2 人', icon: '👥', desc: '搭档配合', isSolo: false },
  { value: 3, label: '3 人', icon: '👥', desc: '三人小队', isSolo: false },
  { value: 4, label: '4 人', icon: '👥', desc: '小型团队', isSolo: false },
  { value: 5, label: '5 人', icon: '👥', desc: '标准团队', isSolo: false },
  { value: 6, label: '6-10 人', icon: '🏢', desc: '有组织架构', isSolo: false },
  { value: 11, label: '11 人以上', icon: '🏗️', desc: '规模化管理', isSolo: false },
];

// ============ 各人数模版 ============

/** 1 人模版 */
const TEMPLATES_1: TemplateDefinition[] = [
  {
    id: 'ONE_MAN_ARMY',
    name: '战神模式',
    icon: '🦸',
    tagline: '你就是全部。所有权限集于一身，无审批流。',
    description: '一人搞定从获客到安装到收款的全流程，系统为你去掉全部多余环节，极简操作一镜到底。',
    roles: [
      { name: '超级管理员 (BOSS)', description: '拥有所有模块的完整权限', count: 1, isBoss: true },
    ],
    features: [
      '全量权限集中 — 无需切换角色',
      '一镜到底 — 线索直达订单，无流转等待',
      '全景工作台 — 营收、欠款、工单一目了然',
      '无审批流 — 不需要自己给自己审批',
    ],
  },
];

/** 2 人模版 */
const TEMPLATES_2: TemplateDefinition[] = [
  {
    id: 'PARALLEL_2',
    name: '合伙人模式',
    icon: '🤝',
    tagline: '两人平等，数据共享，各管各的单。',
    description: '两位合伙人各自独立谈单，互相之间数据透明共享。',
    roles: [
      { name: 'ADMIN', description: '管理权限 + 独立接单', count: 1, isBoss: true },
      { name: '合伙人/销售', description: '独立接单，可查看全部数据', count: 1 },
    ],
    features: [
      '全员数据互通 — 两位合伙人共享客户和订单',
      '独立接单 — 各跟各的客户，不互相牵动',
      '灵活确收 — 每人均可确认自己订单的收款',
      '无强制审批 — 合伙之间信任为先',
    ],
  },
  {
    id: 'FRONT_BACK_2',
    name: '前后端分工',
    icon: '🔀',
    tagline: '一人接单卖货，一人采购交付管账。',
    description: '前端专注客户和销售，后端负责采购跟单和财务。职能清晰、高效流转。',
    roles: [
      {
        name: 'BOSS (兼前端销售)',
        description: '接客户、量尺、报价、签约',
        count: 1,
        isBoss: true,
      },
      { name: '内勤 (兼财务兼采购)', description: '采购下单、跟进交付、确收记账', count: 1 },
    ],
    features: [
      '前后端流转 — 签约后订单自动进入后端待办',
      '职能分离 — 前端做报价、后端跟交付',
      '确收归后端 — 收款确认由内勤负责',
      '轻量审批 — 无多级审批链',
    ],
  },
  {
    id: 'COUPLE_2',
    name: '夫妻店模式',
    icon: '🏠',
    tagline: '一人出门跑业务，一人在家管账管货。',
    description: '外勤负责拓客和现场服务，内业管理店铺运营、厂家对接和财务。',
    roles: [
      { name: 'BOSS (兼外勤)', description: '跑客户、量尺、安装', count: 1, isBoss: true },
      { name: '内业 (兼财务兼采购)', description: '看店、下单给厂家、收款记账', count: 1 },
    ],
    features: [
      '内外分工明确 — 外勤提交、内业审核',
      '关键节点卡控 — 合同和收款由内业确认',
      '采购统一管理 — 内业对接所有厂家',
      '简洁权限 — 外勤看不到财务敏感数据',
    ],
  },
];

/** 3 人模版 */
const TEMPLATES_3: TemplateDefinition[] = [
  {
    id: 'PARALLEL_3',
    name: '三人合伙',
    icon: '🤝',
    tagline: '三人各自跑单，数据共享互不干扰。',
    description: '三位合伙人各自独立谈单、各做各的生意，系统数据完全透明。',
    roles: [
      { name: 'ADMIN', description: '管理权限 + 独立接单', count: 1, isBoss: true },
      { name: '合伙人/销售', description: '独立接单，可查看全部数据', count: 2 },
    ],
    features: [
      '全员数据互通 — 三位合伙人共享客户和订单',
      '独立接单 — 各跟各的客户',
      '灵活确收 — 每人确认自己订单的收款',
      '无审批流 — 合伙之间信任为先',
    ],
  },
  {
    id: 'SPLIT_3',
    name: '标准分工',
    icon: '🔀',
    tagline: '两人跑销售，一人管后勤。',
    description: '前端负责拓客和签约，后端统一处理采购、交付和财务。',
    roles: [
      { name: 'BOSS (兼销售)', description: '接客户、量尺、报价', count: 1, isBoss: true },
      { name: '销售', description: '独立接单、量尺报价', count: 1 },
      { name: '内勤 (兼财务)', description: '采购、跟单交付、确收记账', count: 1 },
    ],
    features: [
      '销售独立 — 两位销售各跟各的客户',
      '后勤集中 — 采购和财务由内勤统管',
      '轻量审批 — 内勤确认收款',
      '数据分层 — 销售看自己的、BOSS看全部',
    ],
  },
  {
    id: 'MANAGED_3',
    name: '带主管模式',
    icon: '👔',
    tagline: 'BOSS 管全局，主管带销售。',
    description: '有初步管理层级：BOSS 负责决策和审批，主管带一名销售。',
    roles: [
      { name: 'ADMIN', description: '全局管理、审批决策', count: 1, isBoss: true },
      { name: '主管/店长', description: '带队管理、报价审核', count: 1 },
      { name: '销售', description: '独立接单、量尺报价', count: 1 },
    ],
    features: [
      '两级审批 — 关键报价需主管确认',
      '管理授权 — 主管分担 BOSS 日常管理',
      '数据分层 — 销售看自己、主管看团队、BOSS看全局',
      '可扩展 — 后续加人直接放到销售岗',
    ],
  },
];

/** 4 人模版 */
const TEMPLATES_4: TemplateDefinition[] = [
  {
    id: 'PARALLEL_4',
    name: '合伙团队',
    icon: '🤝',
    tagline: '四人平行，各管各的单。',
    description: '四位合伙人各自独立跑业务，数据完全透明共享。',
    roles: [
      { name: 'ADMIN', description: '管理权限 + 独立接单', count: 1, isBoss: true },
      { name: '合伙人/销售', description: '独立接单，可查看全部数据', count: 3 },
    ],
    features: [
      '全员数据互通 — 所有人共享客户和订单',
      '独立接单 — 各跟各的客户',
      '灵活确收 — 每人确认自己订单的收款',
      '无审批流 — 合伙之间信任为先',
    ],
  },
  {
    id: 'SPLIT_4',
    name: '销售+后勤',
    icon: '🔀',
    tagline: '两人跑销售，两人管后勤交付。',
    description: '前端负责客户和签约，后端分工处理采购、派单和财务。',
    roles: [
      { name: 'BOSS (兼销售)', description: '接客户、量尺、报价', count: 1, isBoss: true },
      { name: '销售', description: '独立接单、量尺报价', count: 1 },
      { name: '内勤', description: '采购下单、跟单交付', count: 1 },
      { name: '财务/派单', description: '确收记账或安排安装', count: 1 },
    ],
    features: [
      '前后端协作 — 签约后订单流入后端',
      '后勤细分 — 采购和财务/派单分开',
      '数据隔离 — 销售看自己的客户',
      '灵活扩展 — 后续加人直接分配岗位',
    ],
  },
  {
    id: 'MANAGED_4',
    name: '层级管理',
    icon: '👔',
    tagline: 'BOSS→店长→销售→内勤，四岗分明。',
    description: '有明确层级：BOSS 决策，店长管理日常，销售接单，内勤支持。',
    roles: [
      { name: 'ADMIN', description: '全局管理、最终审批', count: 1, isBoss: true },
      { name: '店长/经理', description: '日常管理、报价审批', count: 1 },
      { name: '销售', description: '独立接单、量尺报价', count: 1 },
      { name: '内勤 (兼财务)', description: '采购、交付、确收记账', count: 1 },
    ],
    features: [
      '层级审批 — 关键报价需店长审核',
      '管理授权 — 店长分担 BOSS 管理压力',
      '分岗协作 — 销售和内勤各有专区',
      '数据分层 — 销售→店长→BOSS 逐级可见',
    ],
  },
];

/** 5 人模版 */
const TEMPLATES_5: TemplateDefinition[] = [
  {
    id: 'PARALLEL_5',
    name: '合伙团队',
    icon: '🤝',
    tagline: '五人平行合伙，各管各的单。',
    description: '五位合伙人各自跑业务，数据完全透明。适合人人都是业务能手的团队。',
    roles: [
      { name: 'ADMIN', description: '管理权限 + 独立接单', count: 1, isBoss: true },
      { name: '合伙人/销售', description: '独立接单，可查看全部数据', count: 4 },
    ],
    features: [
      '全员数据互通 — 所有合伙人共享客户和订单',
      '独立接单 — 各跟各的客户',
      '灵活确收 — 每人确认自己订单的收款',
      '无审批流 — 合伙之间信任为先',
    ],
  },
  {
    id: 'SPLIT_5',
    name: '标准门店',
    icon: '🏢',
    tagline: '多名销售+后勤支持，扁平管理。',
    description: '销售负责前端拓客，内勤和派单负责后端支持，管理扁平高效。',
    roles: [
      { name: 'ADMIN', description: '全局管理、数据总览', count: 1, isBoss: true },
      { name: '销售', description: '独立接单、量尺报价', count: 2 },
      { name: '内勤 (兼采购)', description: '采购下单、跟单交付', count: 1 },
      { name: '财务/派单', description: '确收记账、安排安装', count: 1 },
    ],
    features: [
      '数据隔离 — 每位销售只看自己的客户',
      '统一后勤 — 采购和派单集中管理',
      '扁平管理 — 无多级审批',
      '分工清晰 — 前端做单、后端交付',
    ],
  },
  {
    id: 'MANAGED_5',
    name: '层级管理',
    icon: '👔',
    tagline: '有店长审批，销售和内勤分岗明确。',
    description: '店长负责审核和管理，销售和内勤各司其职，流程规范。',
    roles: [
      { name: 'ADMIN', description: '全局管理、最终审批', count: 1, isBoss: true },
      { name: '店长/经理', description: '日常管理、报价审批', count: 1 },
      { name: '销售', description: '独立接单、量尺报价', count: 2 },
      { name: '内勤 (兼财务)', description: '采购、交付、确收记账', count: 1 },
    ],
    features: [
      '层级审批 — 关键报价需店长审核',
      '管理授权 — 店长分担 BOSS 管理压力',
      '数据分层 — 销售→店长→BOSS 逐级可见',
      '分工协作 — 销售、内勤各有专区',
    ],
  },
];

/** 6-10 人模版 */
const TEMPLATES_6_10: TemplateDefinition[] = [
  {
    id: 'STANDARD_STORE',
    name: '标准门店',
    icon: '🏢',
    tagline: '扁平管理，销售各自独立，后勤统一支持。',
    description: '适合有初步分工但管理扁平的团队。销售各自跑单，内勤统一支持采购、派单和财务。',
    roles: [
      { name: 'ADMIN', description: '全局管理、数据总览', count: 1, isBoss: true },
      { name: '销售', description: '独立接单、量尺报价', count: -1 },
      { name: '内勤', description: '采购下单、跟单交付', count: -1 },
      { name: '财务', description: '确收记账、对账', count: -1 },
    ],
    features: [
      '数据隔离 — 每位销售只看自己的客户和订单',
      '统一后勤 — 采购和财务集中管理',
      '扁平审批 — 无店长审批节点',
      '可扩展 — 随时增加派单员、采购员角色',
    ],
  },
  {
    id: 'MANAGED_STORE',
    name: '层级管理',
    icon: '👔',
    tagline: '有店长/经理审批，分岗明确。',
    description: '适合有明确层级管理的团队。店长负责审核关键节点，销售、内勤、派单各司其职。',
    roles: [
      { name: 'ADMIN', description: '全局管理、最终审批', count: 1, isBoss: true },
      { name: '店长/经理', description: '团队管理、报价审批、业绩总览', count: -1 },
      { name: '销售', description: '独立接单、量尺报价', count: -1 },
      { name: '内勤', description: '采购下单、跟单交付', count: -1 },
      { name: '财务', description: '确收记账、对账', count: -1 },
    ],
    features: [
      '层级审批 — 关键报价需店长审核',
      '数据分层 — 销售看自己的、店长看全店、BOSS看全局',
      '分岗协作 — 销售、内勤、店长各有专区',
      '可扩展 — 可随时增加派单员、采购员角色',
    ],
  },
];

/** 11 人以上模版 */
const TEMPLATES_11_PLUS: TemplateDefinition[] = [
  {
    id: 'LARGE_MANAGED',
    name: '大型门店',
    icon: '👔',
    tagline: '完整层级管理，分岗细致。',
    description: '适合大型团队：管理层、销售、内勤、派单、采购、财务各有专人，流程规范。',
    roles: [
      { name: 'ADMIN', description: '全局管理、最终审批', count: 1, isBoss: true },
      { name: '店长/经理', description: '团队管理、报价审批', count: -1 },
      { name: '销售', description: '独立接单、量尺报价', count: -1 },
      { name: '采购', description: '对接厂家、下单跟货', count: -1 },
      { name: '派单员', description: '安排安装和量尺', count: -1 },
      { name: '财务', description: '确收记账、对账结算', count: -1 },
      { name: '内勤', description: '客服、工单跟进', count: -1 },
    ],
    features: [
      '完整层级 — BOSS→经理→各岗位',
      '精细权限 — 每个角色只看到自己的工作范围',
      '多级审批 — 关键节点逐级审批',
      '全岗覆盖 — 销售、采购、派单、财务各有专人',
    ],
  },
  {
    id: 'MULTI_BRANCH',
    name: '多店/连锁',
    icon: '🏗️',
    tagline: '多门店管理，统分结合。',
    description: '适合拥有多个门店或网点的团队，BOSS 总览全局，每个店独立运营。',
    roles: [
      { name: 'ADMIN', description: '总部管理、全局数据', count: 1, isBoss: true },
      { name: '区域经理', description: '管理多个门店、业绩汇总', count: -1 },
      { name: '店长', description: '单店管理、日常审批', count: -1 },
      { name: '销售', description: '独立接单、量尺报价', count: -1 },
      { name: '内勤/财务', description: '采购、交付、财务', count: -1 },
    ],
    features: [
      '多店架构 — 按门店隔离数据',
      '分级管理 — BOSS→区域经理→店长→员工',
      '总部视角 — BOSS可看全局汇总数据',
      '独立运营 — 每个门店可独立运营',
    ],
  },
];

// ============ 核心函数 ============

/**
 * 根据精确人数获取适用的模版列表
 *
 * @param sizeValue - 人数选项值 (1/2/3/4/5/6/11)
 * @returns 对应的模版列表
 */
export function getTemplatesForSize(sizeValue: TeamSizeValue): TemplateDefinition[] {
  switch (sizeValue) {
    case 1:
      return TEMPLATES_1;
    case 2:
      return TEMPLATES_2;
    case 3:
      return TEMPLATES_3;
    case 4:
      return TEMPLATES_4;
    case 5:
      return TEMPLATES_5;
    case 6:
      return TEMPLATES_6_10;
    case 11:
      return TEMPLATES_11_PLUS;
    default:
      return [];
  }
}

/**
 * 根据模版 ID 查找模版定义
 */
export function findTemplateById(templateId: string): TemplateDefinition | undefined {
  const allTemplates = [
    ...TEMPLATES_1,
    ...TEMPLATES_2,
    ...TEMPLATES_3,
    ...TEMPLATES_4,
    ...TEMPLATES_5,
    ...TEMPLATES_6_10,
    ...TEMPLATES_11_PLUS,
  ];
  return allTemplates.find((t) => t.id === templateId);
}
