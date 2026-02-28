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
    VIEW: 'quote.view', // 访问报价模块
    OWN_VIEW: 'quote.own.view', // 查看自己的报价
    OWN_EDIT: 'quote.own.edit', // 编辑自己的报价
    ALL_VIEW: 'quote.all.view', // 查看所有报价
    ALL_EDIT: 'quote.all.edit', // 编辑所有报价
    APPROVE: 'quote.approve', // 审批报价
    DELETE: 'quote.delete', // 删除报价
  },

  // ==================== 订单模块 ====================
  ORDER: {
    VIEW: 'order.view', // 访问订单模块
    OWN_VIEW: 'order.own.view', // 查看自己的订单
    OWN_EDIT: 'order.own.edit', // 编辑自己的订单
    ALL_VIEW: 'order.all.view', // 查看所有订单
    ALL_EDIT: 'order.all.edit', // 编辑所有订单
    APPROVE: 'order.approve', // 审批订单
    DELETE: 'order.delete', // 删除订单
    // --- 下列权限已废弃，请勿在新代码中使用 ---
    // CREATE: 'order.create'  → 已合并到 OWN_EDIT
    // EDIT:   'order.edit'    → 已合并到 OWN_EDIT
    // MANAGE: 'order.manage'  → 已被更细粒度的控制取代
  },

  // ==================== 测量模块 ====================
  MEASURE: {
    VIEW: 'measure.view', // 访问测量模块
    OWN_VIEW: 'measure.own.view', // 查看自己的测量任务
    OWN_EDIT: 'measure.own.edit', // 编辑自己的测量任务
    ALL_VIEW: 'measure.all.view', // 查看所有测量任务
    ALL_EDIT: 'measure.all.edit', // 编辑所有测量任务
    DISPATCH: 'measure.dispatch', // 派发测量任务
    COMPLETE: 'measure.complete', // 完成测量任务
  },

  // ==================== 安装模块 ====================
  INSTALL: {
    VIEW: 'install.view', // 访问安装模块
    OWN_VIEW: 'install.own.view', // 查看自己的安装任务
    OWN_EDIT: 'install.own.edit', // 编辑自己的安装任务
    ALL_VIEW: 'install.all.view', // 查看所有安装任务
    ALL_EDIT: 'install.all.edit', // 编辑所有安装任务
    DISPATCH: 'install.dispatch', // 派发安装任务
    COMPLETE: 'install.complete', // 完成安装任务
  },

  // ==================== 售后模块 ====================
  AFTER_SALES: {
    VIEW: 'after_sales.view', // 访问售后模块
    OWN_VIEW: 'after_sales.own.view', // 查看自己的售后
    OWN_EDIT: 'after_sales.own.edit', // 编辑自己的售后
    ALL_VIEW: 'after_sales.all.view', // 查看所有售后
    ALL_EDIT: 'after_sales.all.edit', // 编辑所有售后
    DELETE: 'after_sales.delete', // 删除售后
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
  'quote.view': '访问报价模块',
  'quote.own.view': '查看我的报价',
  'quote.own.edit': '编辑我的报价',
  'quote.all.view': '查看所有报价',
  'quote.all.edit': '编辑所有报价',
  'quote.approve': '审批报价',
  'quote.delete': '删除报价',
  // 订单
  'order.view': '访问订单模块',
  'order.own.view': '查看我的订单',
  'order.own.edit': '编辑我的订单',
  'order.all.view': '查看所有订单',
  'order.all.edit': '编辑所有订单',
  'order.approve': '审批订单',
  'order.delete': '删除订单',
  // 测量
  'measure.view': '访问测量模块',
  'measure.own.view': '查看我的测量任务',
  'measure.own.edit': '编辑我的测量任务',
  'measure.all.view': '查看所有测量任务',
  'measure.all.edit': '编辑所有测量任务',
  'measure.dispatch': '派发测量任务',
  'measure.complete': '完成测量任务',
  // 安装
  'install.view': '访问安装模块',
  'install.own.view': '查看我的安装任务',
  'install.own.edit': '编辑我的安装任务',
  'install.all.view': '查看所有安装任务',
  'install.all.edit': '编辑所有安装任务',
  'install.dispatch': '派发安装任务',
  'install.complete': '完成安装任务',
  // 售后
  'after_sales.view': '访问售后模块',
  'after_sales.own.view': '查看我的售后',
  'after_sales.own.edit': '编辑我的售后',
  'after_sales.all.view': '查看所有售后',
  'after_sales.all.edit': '编辑所有售后',
  'after_sales.delete': '删除售后',
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

// ==================== 权限业务说明（用于 Tooltip 气泡） ====================

/**
 * 权限业务说明映射
 * 用于权限矩阵中鼠标悬停时弹出的气泡说明，解释该权限在业务上的实际作用。
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // 线索模块
  'lead.all.view': '可查看系统内所有销售人员的线索，包括他人负责的线索。适合经理进行进度监控和资源调配。',
  'lead.all.edit': '可创建、修改系统内所有人的线索，包括转移负责人。拥有此权限即隐含查看所有线索的能力。',
  'lead.own.view': '只能查看分配给自己的线索，无法看到其他销售人员的线索。',
  'lead.own.edit': '可创建新线索，并修改分配给自己的线索信息。创建和编辑能力合并在此权限内。',
  'lead.delete': '可将线索标记为作废（软删除）。一般仅授予有删除权的角色，删除后可恢复。',
  'lead.assign': '可将线索分配给指定的销售人员。通常由经理或管理员使用，用于人员调度。',
  'lead.transfer': '可将已分配的线索转移到其他销售，或释放到公海池由销售自行认领。',
  'lead.import': '可通过 Excel/CSV 批量导入线索，用于从其他系统迁移数据或批量录入。',
  'lead.export': '可将线索列表导出为文件，用于数据备份或离线分析。',
  'lead.view': '可访问线索模块入口，查看线索列表页面。',
  'lead.pool.view': '可查看公海池（未分配）中的所有线索，并自行认领。销售可主动抢客户。',
  'lead.restore': '可将已作废的线索恢复为正常状态，继续跟进。适用于误操作恢复场景。',
  // 客户模块
  'customer.all.view': '可查看系统内所有客户的详细信息，包括其他销售负责的客户。',
  'customer.all.edit': '可创建并修改系统内所有客户的信息，不受负责人限制。',
  'customer.own.view': '只能查看自己负责的客户，保护客户数据隐私，避免销售之间的信息泄露。',
  'customer.own.edit': '可创建新客户，并修改自己负责客户的信息，包括联系方式、地址等。',
  'customer.delete': '可软删除客户记录。高风险操作，建议仅授予经理级及以上角色。',
  'customer.view': '可访问客户模块入口，查看客户列表页面。',
  'customer.merge': '可发起客户合并审批申请，将重复的客户记录合并为一个，需经理审批通过后执行。',
  // 报价模块
  'quote.all.view': '可查看系统内所有销售创建的报价单，用于整体业务监控。',
  'quote.all.edit': '可修改所有报价单，包括他人创建的报价。',
  'quote.own.view': '只能查看自己创建的报价单。',
  'quote.own.edit': '可创建新报价单并修改自己的报价，包括添加产品、调整价格等。',
  'quote.delete': '可删除报价单。通常仅授予经理，避免报价记录的意外删除。',
  'quote.approve': '可审批报价单，决定报价是否生效。通常为经理或高级管理角色独有。',
  'quote.view': '可访问报价模块入口。',
  // 订单模块
  'order.all.view': '可查看系统内所有订单，用于运营管理和财务核对。',
  'order.all.edit': '可修改所有订单的内容，包括产品明细、金额等。',
  'order.own.view': '只能查看自己负责的订单。',
  'order.own.edit': '可修改自己负责订单的信息，推进订单流程。',
  'order.delete': '可删除订单记录。已签订单通常不应删除，此权限需谨慎授予。',
  'order.approve': '可审批订单，决定订单是否通过。通常为经理独有。',
  'order.view': '可访问订单模块入口。',
  // 测量模块
  'measure.all.view': '可查看系统内所有测量任务，用于调度和进度监控。',
  'measure.own.view': '只能查看分配给自己的测量任务。',
  'measure.dispatch': '可将测量任务派发给测量工人，安排上门量尺时间。',
  'measure.complete': '可将测量任务标记为已完成，并上传测量数据和图纸。',
  'measure.view': '可访问测量模块入口。',
  'measure.all.edit': '可全面管理测量任务，包括创建、修改、删除等操作。',
  // 安装模块
  'install.all.view': '可查看系统内所有安装任务，用于调度和进度监控。',
  'install.own.view': '只能查看分配给自己的安装任务。',
  'install.dispatch': '可将安装任务派发给安装工人，安排上门安装时间。',
  'install.complete': '可将安装任务标记为已完成，并上传安装照片和验收记录。',
  'install.view': '可访问安装模块入口。',
  // 售后模块
  'after_sales.all.view': '可查看系统内所有售后工单，用于质量管理和客诉监控。',
  'after_sales.all.edit': '可处理所有售后工单，调配售后资源。',
  'after_sales.own.view': '只能查看分配给自己负责的售后工单。',
  'after_sales.own.edit': '可创建售后工单并处理自己负责的售后任务。',
  'after_sales.delete': '可删除售后工单记录。',
  'after_sales.view': '可访问售后模块入口。',
  // 财务模块
  'finance.ar.view': '可查看应收账款、客户欠款及收款记录，用于财务对账。',
  'finance.ar.create': '可创建收款单、开具退款或折让单，记录客户付款情况。',
  'finance.ar.reconcile': '可对应收账款进行核销操作，确认款项已收清或冲抵。',
  'finance.ap.view': '可查看应付账款、供应商欠款及付款记录。',
  'finance.ap.create': '可创建付款单、扣款单或退货单，记录向供应商付款的情况。',
  'finance.ap.reconcile': '可对应付账款进行核销操作，确认款项已付清。',
  'finance.approve': '可审批收付款单据，决定财务流水是否生效。',
  'finance.review': '可对已审批的单据进行二次复核，确保财务数据的准确性。',
  'finance.report.view': '可查看利润表、收支汇总等财务报表，掌握整体经营状况。',
  'finance.report.export': '可将财务报表导出为 PDF 或 Excel 文件，用于外部汇报或归档。',
  'finance.journal.view': '可查看日记账和总账，追溯每一笔资金流动的凭证记录。',
  'finance.journal.create': '可录入会计凭证，在系统中记录手动调账或特殊财务处理。',
  'finance.expense.create': '可录入或批量导入费用数据，包括人工费、材料费等。',
  'finance.transfer.view': '可查看内部资金调拨记录，例如账户之间的转账。',
  'finance.transfer.create': '可发起内部账户之间的资金调拨操作。',
  'finance.config.manage': '可管理会计科目表、账期设置和资金账户配置，属于财务基础设置。',
  'finance.labor_view': '可查看与工人相关的人工费用明细。',
  // 产品模块
  'products.view': '可查看产品目录和价格体系，用于开报价时选择产品。',
  'products.create': '可向系统添加新产品或服务项目。',
  'products.edit': '可修改现有产品的名称、单位、价格等信息。',
  'products.delete': '可从产品目录中删除产品。',
  // 供应链模块
  'supply_chain.view': '可查看采购订单和库存数据。',
  'supply_chain.create': '可创建新的采购订单，向供应商下单。',
  'supply_chain.edit': '可修改已有的采购订单。',
  'supply_chain.delete': '可删除采购订单记录。',
  'supply_chain.supplier': '可管理供应商信息，包括新增、修改供应商档案。',
  'supply_chain.stock': '可管理库存，查看库存数量并进行入库/出库操作。',
  'supply_chain.po_manage': '可全面管理采购订单的整个生命周期。',
  // 渠道模块
  'channel.view': '可查看合作渠道（分销商、中介等）的基本信息。',
  'channel.create': '可添加新的渠道合作伙伴。',
  'channel.edit': '可修改渠道信息和合作条款。',
  'channel.delete': '可删除渠道合作伙伴记录。',
  'channel.commission': '可查看和管理渠道佣金，包括佣金比例设置和核算。',
  'channel.settlement': '可执行渠道结算操作，向合作伙伴支付佣金。',
  // 数据分析
  'analytics.view': '可查看与自己相关的数据报表，如个人业绩、跟单转化率等。',
  'analytics.view_all': '可查看全公司维度的报表，包括所有销售的汇总数据。',
  'analytics.export': '可将报表数据导出为文件，用于外部汇报或深度分析。',
  // 销售目标
  'sales_targets.view': '可查看为自己或团队设定的销售目标及完成进度。',
  'sales_targets.manage': '可为销售人员设定销售目标、调整目标数值，并进行目标拆解。',
  // 系统设置
  'settings.view': '可访问系统设置页面，查看基础配置信息。',
  'settings.user': '可管理系统用户，包括邀请新成员、修改用户信息、停用账号等。',
  'settings.role': '可管理角色权限矩阵，调整各角色的权限配置。高权限操作，请谨慎授予。',
  'settings.manage': '可进行完整的系统设置，包括公司信息、业务流程配置等。',
  'settings.invite_worker': '可向外部工人发送入驻邀请，让其注册并绑定到本门店。',
  // 管理员
  'admin.settings': '可访问和修改系统级别的技术设置，通常仅限平台管理员。',
  'admin.user_manage': '可跨租户管理用户，属于平台级超级权限。',
  'admin.role_manage': '可跨租户管理角色，属于平台级超级权限。',
  'admin.tenant': '可管理租户，包括创建和配置企业账号，属于最高权限。',
};

/**
 * 获取权限的业务说明
 * @param permission 权限代码
 * @returns 中文业务说明，若无则返回空字符串
 */
export function getPermissionDescription(permission: string): string {
  return PERMISSION_DESCRIPTIONS[permission] || '';
}

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
