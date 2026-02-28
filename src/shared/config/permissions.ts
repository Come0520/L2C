/**
 * 权限定义 - 权限矩阵系统
 *
 * 命名规范：
 * - {模块}.{数据范围}.{操作} 格式（如 order.all.view）
 * - {模块}.{特殊操作} 格式（如 order.approve）
 *
 * 数据范围：
 * - ALL: 全部数据
 * - OWN: 仅自己负责的数据
 *
 * 操作类型：
 * - VIEW: 只读访问
 * - EDIT: 创建/修改
 * - DELETE: 删除
 * - 特殊操作：APPROVE, ASSIGN, DISPATCH 等
 */

// ==================== 权限状态枚举 ====================

/**
 * 权限状态：三态权限
 */
export type PermissionState = 'VIEW' | 'EDIT' | 'NONE';

// ==================== 权限定义 ====================

export const PERMISSIONS = {
  // ==================== 线索模块 ====================
  LEAD: {
    ALL_VIEW: 'lead.all.view', // 查看所有线索（含他人）
    ALL_EDIT: 'lead.all.edit', // 编辑所有线索（含他人），隐含创建能力
    OWN_VIEW: 'lead.own.view', // 查看分配给自己的线索
    OWN_EDIT: 'lead.own.edit', // 编辑/创建自己的线索
    DELETE: 'lead.delete', // 删除线索
    ASSIGN: 'lead.assign', // 分配线索给他人
    TRANSFER: 'lead.transfer', // 转移线索（含释放到公海）
    IMPORT: 'lead.import', // 导入线索
    EXPORT: 'lead.export', // 导出线索
    VIEW: 'lead.view', // 访问线索模块入口
    POOL_VIEW: 'lead.pool.view', // 查看公海（待分配）线索
    RESTORE: 'lead.restore', // 恢复已作废线索
    // --- 下列权限已废弃，请勿在新代码中使用 ---
    // CREATE: 'lead.create'  → 已合并到 OWN_EDIT
    // EDIT:   'lead.edit'    → 已合并到 OWN_EDIT
    // MANAGE: 'lead.manage'  → 拆分为 RESTORE
  },

  // ==================== 客户模块 ====================
  CUSTOMER: {
    ALL_VIEW: 'customer.all.view', // 查看所有客户（含他人）
    ALL_EDIT: 'customer.all.edit', // 编辑所有客户（含创建）
    OWN_VIEW: 'customer.own.view', // 查看自己负责的客户
    OWN_EDIT: 'customer.own.edit', // 编辑/创建自己的客户
    DELETE: 'customer.delete', // 删除客户
    VIEW: 'customer.view', // 访问客户模块入口
    MERGE: 'customer.merge', // 客户合并（提交审批 + 预览合并）
    // --- 下列权限已废弃，请勿在新代码中使用 ---
    // CREATE: 'customer.create'  → 已合并到 OWN_EDIT
    // EDIT:   'customer.edit'    → 已合并到 OWN_EDIT
    // MANAGE: 'customer.manage'  → 改名为 MERGE
  },

  // ==================== 报价模块 ====================
  QUOTE: {
    ALL_VIEW: 'quote.all.view', // 查看所有报价
    ALL_EDIT: 'quote.all.edit', // 编辑所有报价
    OWN_VIEW: 'quote.own.view', // 查看自己的报价
    OWN_EDIT: 'quote.own.edit', // 编辑自己的报价
    DELETE: 'quote.delete', // 删除报价
    APPROVE: 'quote.approve', // 审批报价
    VIEW: 'quote.view', // 访问报价模块
    CREATE: 'quote.create', // 创建报价
    EDIT: 'quote.edit', // 编辑报价
    MANAGE: 'quote.manage', // 管理报价
  },

  // ==================== 订单模块 ====================
  ORDER: {
    ALL_VIEW: 'order.all.view', // 查看所有订单
    ALL_EDIT: 'order.all.edit', // 编辑所有订单
    OWN_VIEW: 'order.own.view', // 查看自己的订单
    OWN_EDIT: 'order.own.edit', // 编辑自己的订单
    DELETE: 'order.delete', // 删除订单
    APPROVE: 'order.approve', // 审批订单
    VIEW: 'order.view', // 访问订单模块
    CREATE: 'order.create', // 创建订单
    EDIT: 'order.edit', // 编辑订单
    MANAGE: 'order.manage', // 管理订单
  },

  // ==================== 测量模块 ====================
  MEASURE: {
    ALL_VIEW: 'measure.all.view', // 查看所有测量任务
    OWN_VIEW: 'measure.own.view', // 查看自己的测量任务
    DISPATCH: 'measure.dispatch', // 派发测量任务
    COMPLETE: 'measure.complete', // 完成测量任务
    VIEW: 'measure.view', // 访问测量模块
    MANAGE: 'measure.manage', // 管理测量任务 (新增)
  },

  // ==================== 安装模块 ====================
  INSTALL: {
    ALL_VIEW: 'install.all.view', // 查看所有安装任务
    OWN_VIEW: 'install.own.view', // 查看自己的安装任务
    DISPATCH: 'install.dispatch', // 派发安装任务
    COMPLETE: 'install.complete', // 完成安装任务
    VIEW: 'install.view', // 访问安装模块
    CREATE: 'install.create', // 创建安装任务
    EDIT: 'install.edit', // 编辑安装任务
    MANAGE: 'install.manage', // 管理安装任务
  },

  // ==================== 售后模块 ====================
  AFTER_SALES: {
    ALL_VIEW: 'after_sales.all.view', // 查看所有售后
    ALL_EDIT: 'after_sales.all.edit', // 编辑所有售后
    OWN_VIEW: 'after_sales.own.view', // 查看自己的售后
    OWN_EDIT: 'after_sales.own.edit', // 编辑自己的售后
    DELETE: 'after_sales.delete', // 删除售后
    VIEW: 'after_sales.view', // 访问售后模块
    CREATE: 'after_sales.create', // 创建售后
    EDIT: 'after_sales.edit', // 编辑售后
    MANAGE: 'after_sales.manage', // 管理售后
  },

  // ==================== 财务模块 ====================
  FINANCE: {
    // --- 应收 (AR) ---
    AR_VIEW: 'finance.ar.view', // 查看应收对账单、收款记录
    AR_CREATE: 'finance.ar.create', // 创建收款单、退款/折让单
    AR_RECONCILE: 'finance.ar.reconcile', // 应收核销
    // --- 应付 (AP) ---
    AP_VIEW: 'finance.ap.view', // 查看应付对账单、付款记录
    AP_CREATE: 'finance.ap.create', // 创建付款单、扣款/退货单
    AP_RECONCILE: 'finance.ap.reconcile', // 应付核销
    // --- 复核与审批 ---
    APPROVE: 'finance.approve', // 审批收付款单据
    REVIEW: 'finance.review', // 复核已审批单据（财务二审）
    // --- 报表 ---
    REPORT_VIEW: 'finance.report.view', // 查看财务报表
    REPORT_EXPORT: 'finance.report.export', // 导出报表 PDF
    // --- 记账 ---
    JOURNAL_VIEW: 'finance.journal.view', // 查看日记账/总账
    JOURNAL_CREATE: 'finance.journal.create', // 创建日记账凭证
    // --- 费用 ---
    EXPENSE_CREATE: 'finance.expense.create', // 录入/导入费用
    // --- 调拨 ---
    TRANSFER_VIEW: 'finance.transfer.view', // 查看资金调拨
    TRANSFER_CREATE: 'finance.transfer.create', // 创建资金调拨
    // --- 配置 ---
    CONFIG_MANAGE: 'finance.config.manage', // 科目表/会计期间/账户管理
    // --- 通用/兼容 ---
    LABOR_VIEW: 'finance.labor_view', // 查看人工费用
  },

  // ==================== 产品模块 ====================
  PRODUCTS: {
    VIEW: 'products.view', // 查看产品
    CREATE: 'products.create', // 创建产品
    EDIT: 'products.edit', // 编辑产品
    DELETE: 'products.delete', // 删除产品
    MANAGE: 'products.manage', // 产品管理
  },

  // ==================== 供应链模块 ====================
  SUPPLY_CHAIN: {
    VIEW: 'supply_chain.view', // 查看供应链
    CREATE: 'supply_chain.create', // 创建采购单
    EDIT: 'supply_chain.edit', // 编辑采购单
    DELETE: 'supply_chain.delete', // 删除采购单
    SUPPLIER_MANAGE: 'supply_chain.supplier', // 供应商管理
    STOCK_MANAGE: 'supply_chain.stock', // 库存管理
    PO_MANAGE: 'supply_chain.po_manage', // 采购单管理
    MANAGE: 'supply_chain.manage', // 供应链管理
  },

  // ==================== 渠道模块 ====================
  CHANNEL: {
    VIEW: 'channel.view', // 查看渠道
    CREATE: 'channel.create', // 创建渠道
    EDIT: 'channel.edit', // 编辑渠道
    DELETE: 'channel.delete', // 删除渠道
    COMMISSION: 'channel.commission', // 佣金管理
    SETTLEMENT: 'channel.settlement', // 结算管理
    MANAGE_COMMISSION: 'channel.manage_commission', // 佣金管理(兼容)
    MANAGE_SETTLEMENT: 'channel.manage_settlement', // 结算管理(兼容)
  },

  // ==================== 数据分析模块 ====================
  ANALYTICS: {
    VIEW: 'analytics.view', // 查看报表
    VIEW_ALL: 'analytics.view_all', // 查看全部数据报表
    EXPORT: 'analytics.export', // 导出报表
  },

  // ==================== 销售目标模块 ====================
  SALES_TARGETS: {
    VIEW: 'sales_targets.view', // 查看销售目标
    MANAGE: 'sales_targets.manage', // 设置/修改/拆解销售目标
  },

  // ==================== 系统设置 ====================
  SETTINGS: {
    VIEW: 'settings.view', // 查看设置
    USER_MANAGE: 'settings.user', // 用户管理
    ROLE_MANAGE: 'settings.role', // 角色管理
    MANAGE: 'settings.manage', // 完整设置权限
    INVITE_WORKER: 'settings.invite_worker', // 邀请工人入驻
  },

  // ==================== 管理员权限 ====================
  ADMIN: {
    SETTINGS: 'admin.settings', // 系统设置
    USER_MANAGE: 'admin.user_manage', // 用户管理
    ROLE_MANAGE: 'admin.role_manage', // 角色管理
    TENANT_MANAGE: 'admin.tenant', // 租户管理
  },

  // ==================== 全局权限 ====================
  GLOBAL: {
    VIEW: '*', // 超级查看权限
    ADMIN: '**', // 超级管理员
  },

  // ==================== 通知模块 ====================
  NOTIFICATION: {
    VIEW: 'notification.view',
    MANAGE: 'notification.manage',
  },
} as const;

/**
 * 权限类型导出
 */
export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];

// ==================== 权限分组（用于矩阵 UI） ====================

/**
 * 权限分组定义 - 按业务流程顺序排列
 */
export interface PermissionGroup {
  key: string;
  label: string;
  description?: string;
  permissions: Record<string, string>;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'LEAD',
    label: '线索管理',
    description: '销售线索的管理与分配',
    permissions: PERMISSIONS.LEAD,
  },
  {
    key: 'CUSTOMER',
    label: '客户管理',
    description: '客户信息维护',
    permissions: PERMISSIONS.CUSTOMER,
  },
  {
    key: 'QUOTE',
    label: '报价管理',
    description: '报价创建与审批',
    permissions: PERMISSIONS.QUOTE,
  },
  {
    key: 'ORDER',
    label: '订单管理',
    description: '订单生命周期管理',
    permissions: PERMISSIONS.ORDER,
  },
  {
    key: 'MEASURE',
    label: '测量服务',
    description: '测量任务派工与执行',
    permissions: PERMISSIONS.MEASURE,
  },
  {
    key: 'INSTALL',
    label: '安装服务',
    description: '安装任务派工与执行',
    permissions: PERMISSIONS.INSTALL,
  },
  {
    key: 'AFTER_SALES',
    label: '售后服务',
    description: '售后工单处理',
    permissions: PERMISSIONS.AFTER_SALES,
  },
  {
    key: 'FINANCE',
    label: '财务管理',
    description: '应收应付、复核审批与财务报表',
    permissions: PERMISSIONS.FINANCE,
  },
  {
    key: 'PRODUCTS',
    label: '产品管理',
    description: '产品目录维护',
    permissions: PERMISSIONS.PRODUCTS,
  },
  {
    key: 'SUPPLY_CHAIN',
    label: '供应链',
    description: '采购与库存',
    permissions: PERMISSIONS.SUPPLY_CHAIN,
  },
  {
    key: 'CHANNEL',
    label: '渠道管理',
    description: '渠道合作与佣金',
    permissions: PERMISSIONS.CHANNEL,
  },
  {
    key: 'ANALYTICS',
    label: '数据分析',
    description: '报表与统计',
    permissions: PERMISSIONS.ANALYTICS,
  },
  {
    key: 'SALES_TARGETS',
    label: '销售目标',
    description: '销售目标设定与管理',
    permissions: PERMISSIONS.SALES_TARGETS,
  },
  {
    key: 'SETTINGS',
    label: '系统设置',
    description: '系统配置与用户管理',
    permissions: PERMISSIONS.SETTINGS,
  },
] as const;

// ==================== 权限标签映射（用于 UI 显示） ====================

export const PERMISSION_LABELS: Record<string, string> = {
  // 线索
  'lead.all.view': '查看所有线索',
  'lead.all.edit': '编辑所有线索',
  'lead.own.view': '查看我的线索',
  'lead.own.edit': '编辑我的线索',
  'lead.delete': '删除线索',
  'lead.assign': '分配线索',
  'lead.transfer': '转移线索',
  'lead.import': '导入线索',
  'lead.export': '导出线索',
  'lead.view': '访问线索模块',
  'lead.pool.view': '查看公海线索',
  'lead.restore': '恢复作废线索',
  // 客户
  'customer.all.view': '查看所有客户',
  'customer.all.edit': '编辑所有客户',
  'customer.own.view': '查看我的客户',
  'customer.own.edit': '编辑我的客户',
  'customer.delete': '删除客户',
  'customer.view': '访问客户模块',
  'customer.merge': '客户合并',
  // 报价
  'quote.all.view': '查看所有报价',
  'quote.all.edit': '编辑所有报价',
  'quote.own.view': '查看我的报价',
  'quote.own.edit': '编辑我的报价',
  'quote.delete': '删除报价',
  'quote.approve': '审批报价',
  'quote.view': '访问报价模块',
  // 订单
  'order.all.view': '查看所有订单',
  'order.all.edit': '编辑所有订单',
  'order.own.view': '查看我的订单',
  'order.own.edit': '编辑我的订单',
  'order.delete': '删除订单',
  'order.approve': '审批订单',
  'order.view': '访问订单模块',
  // 测量
  'measure.all.view': '查看所有测量任务',
  'measure.own.view': '查看我的测量任务',
  'measure.dispatch': '派发测量任务',
  'measure.complete': '完成测量任务',
  'measure.view': '访问测量模块',
  'measure.manage': '管理测量任务',
  // 安装
  'install.all.view': '查看所有安装任务',
  'install.own.view': '查看我的安装任务',
  'install.dispatch': '派发安装任务',
  'install.complete': '完成安装任务',
  'install.view': '访问安装模块',
  // 售后
  'after_sales.all.view': '查看所有售后',
  'after_sales.all.edit': '编辑所有售后',
  'after_sales.own.view': '查看我的售后',
  'after_sales.own.edit': '编辑我的售后',
  'after_sales.delete': '删除售后',
  'after_sales.view': '访问售后模块',
  // 财务 - 应收
  'finance.ar.view': '查看应收',
  'finance.ar.create': '创建收款/退款',
  'finance.ar.reconcile': '应收核销',
  // 财务 - 应付
  'finance.ap.view': '查看应付',
  'finance.ap.create': '创建付款/扣款',
  'finance.ap.reconcile': '应付核销',
  // 财务 - 复核
  'finance.approve': '审批财务',
  'finance.review': '财务复核',
  // 财务 - 报表
  'finance.report.view': '查看财务报表',
  'finance.report.export': '导出报表',
  // 财务 - 记账
  'finance.journal.view': '查看日记账',
  'finance.journal.create': '创建凭证',
  // 财务 - 其他
  'finance.expense.create': '录入费用',
  'finance.transfer.view': '查看调拨',
  'finance.transfer.create': '创建调拨',
  'finance.config.manage': '财务配置',
  'finance.labor_view': '查看人工费',
  // 产品
  'products.view': '查看产品',
  'products.create': '创建产品',
  'products.edit': '编辑产品',
  'products.delete': '删除产品',
  // 供应链
  'supply_chain.view': '查看供应链',
  'supply_chain.create': '创建采购单',
  'supply_chain.edit': '编辑采购单',
  'supply_chain.delete': '删除采购单',
  'supply_chain.supplier': '供应商管理',
  'supply_chain.stock': '库存管理',
  'supply_chain.po_manage': '采购单管理',
  // 渠道
  'channel.view': '查看渠道',
  'channel.create': '创建渠道',
  'channel.edit': '编辑渠道',
  'channel.delete': '删除渠道',
  'channel.commission': '佣金管理',
  'channel.settlement': '结算管理',
  // 分析
  'analytics.view': '查看报表',
  'analytics.view_all': '查看全部报表',
  'analytics.export': '导出报表',
  // 销售目标
  'sales_targets.view': '查看销售目标',
  'sales_targets.manage': '管理销售目标',
  // 设置
  'settings.view': '查看设置',
  'settings.user': '用户管理',
  'settings.role': '角色管理',
  'settings.manage': '系统管理',
  'settings.invite_worker': '邀请成员(仅限工人)',
  // 管理员
  'admin.settings': '系统设置',
  'admin.user_manage': '用户管理',
  'admin.role_manage': '角色管理',
  'admin.tenant': '租户管理',
};

/**
 * 获取权限的中文标签
 */
export function getPermissionLabel(permission: string): string {
  return PERMISSION_LABELS[permission] || permission;
}

/**
 * 获取所有权限的扁平列表
 */
export function getAllPermissions(): string[] {
  const permissions: string[] = [];
  for (const group of Object.values(PERMISSIONS)) {
    if (typeof group === 'object') {
      permissions.push(...Object.values(group));
    }
  }
  return permissions;
}
