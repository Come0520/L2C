import { PERMISSIONS } from './permissions';

export { PERMISSIONS };

/**
 * 角色定义
 *
 * 系统预设 7 个标准角色，租户可通过权限覆盖进行微调
 */
export interface RoleDefinition {
  code: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean; // 是否为系统预设角色
}

/**
 * 系统预设角色配置
 */
export const ROLES: Record<string, RoleDefinition> = {
  // ==================== 管理员 ====================
  ADMIN: {
    code: 'ADMIN',
    name: '管理员',
    description: '租户老板/超级管理员，拥有全部权限',
    isSystem: true,
    permissions: [
      // 全局权限
      PERMISSIONS.GLOBAL.ADMIN,
    ],
  },

  // ==================== 经理 ====================
  MANAGER: {
    code: 'MANAGER',
    name: '经理',
    description: '门店店长，管理日常运营，有审批权限',
    isSystem: true,
    permissions: [
      // 线索 - 全部权限
      PERMISSIONS.LEAD.ALL_VIEW,
      PERMISSIONS.LEAD.ALL_EDIT,
      PERMISSIONS.LEAD.ASSIGN,
      PERMISSIONS.LEAD.TRANSFER,
      PERMISSIONS.LEAD.IMPORT,
      PERMISSIONS.LEAD.EXPORT,
      // 客户 - 全部权限
      PERMISSIONS.CUSTOMER.ALL_VIEW,
      PERMISSIONS.CUSTOMER.ALL_EDIT,
      PERMISSIONS.CUSTOMER.DELETE,
      // 报价 - 全部权限 + 审批 + 删除
      PERMISSIONS.QUOTE.ALL_VIEW,
      PERMISSIONS.QUOTE.ALL_EDIT,
      PERMISSIONS.QUOTE.APPROVE,
      PERMISSIONS.QUOTE.DELETE,
      // 订单 - 全部权限 + 审批（不给删除，已签订单不应删除）
      PERMISSIONS.ORDER.ALL_VIEW,
      PERMISSIONS.ORDER.ALL_EDIT,
      PERMISSIONS.ORDER.APPROVE,
      // 测量/安装 - 派工
      PERMISSIONS.MEASURE.ALL_VIEW,
      PERMISSIONS.MEASURE.DISPATCH,
      PERMISSIONS.INSTALL.ALL_VIEW,
      PERMISSIONS.INSTALL.DISPATCH,
      // 售后 - 全部权限 + 删除
      PERMISSIONS.AFTER_SALES.ALL_VIEW,
      PERMISSIONS.AFTER_SALES.ALL_EDIT,
      PERMISSIONS.AFTER_SALES.DELETE,
      // 财务 - 查看
      PERMISSIONS.FINANCE.VIEW,
      PERMISSIONS.FINANCE.LABOR_VIEW,
      // 产品 - 完整权限
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.PRODUCTS.CREATE,
      PERMISSIONS.PRODUCTS.EDIT,
      PERMISSIONS.PRODUCTS.DELETE,
      // 供应链 - 查看
      PERMISSIONS.SUPPLY_CHAIN.VIEW,
      // 渠道 - 全部
      PERMISSIONS.CHANNEL.VIEW,
      PERMISSIONS.CHANNEL.CREATE,
      PERMISSIONS.CHANNEL.EDIT,
      PERMISSIONS.CHANNEL.COMMISSION,
      // 分析 - 全部数据
      PERMISSIONS.ANALYTICS.VIEW,
      PERMISSIONS.ANALYTICS.VIEW_ALL,
      PERMISSIONS.ANALYTICS.EXPORT,
      // 设置 - 用户管理 + 角色管理
      PERMISSIONS.SETTINGS.VIEW,
      PERMISSIONS.SETTINGS.USER_MANAGE,
      PERMISSIONS.SETTINGS.ROLE_MANAGE,
      PERMISSIONS.ADMIN.SETTINGS,
    ],
  },

  // ==================== 销售 ====================
  SALES: {
    code: 'SALES',
    name: '销售',
    description: '销售人员，负责线索跟进、客户维护、报价和订单',
    isSystem: true,
    permissions: [
      // 线索 - 自己的 + 创建
      PERMISSIONS.LEAD.OWN_VIEW,
      PERMISSIONS.LEAD.OWN_EDIT,
      PERMISSIONS.LEAD.CREATE,
      // 客户 - 自己的 + 创建
      PERMISSIONS.CUSTOMER.OWN_VIEW,
      PERMISSIONS.CUSTOMER.OWN_EDIT,
      PERMISSIONS.CUSTOMER.CREATE,
      // 报价 - 自己的 + 创建
      PERMISSIONS.QUOTE.OWN_VIEW,
      PERMISSIONS.QUOTE.OWN_EDIT,
      PERMISSIONS.QUOTE.CREATE,
      // 订单 - 仅自己
      PERMISSIONS.ORDER.OWN_VIEW,
      PERMISSIONS.ORDER.OWN_EDIT,
      // 测量/安装 - 查看自己相关的
      PERMISSIONS.MEASURE.OWN_VIEW,
      PERMISSIONS.INSTALL.OWN_VIEW,
      // 售后 - 自己的 + 创建
      PERMISSIONS.AFTER_SALES.OWN_VIEW,
      PERMISSIONS.AFTER_SALES.OWN_EDIT,
      PERMISSIONS.AFTER_SALES.CREATE,
      // 渠道 - 仅查看（了解客户来源）
      PERMISSIONS.CHANNEL.VIEW,
      // 产品 - 仅查看
      PERMISSIONS.PRODUCTS.VIEW,
      // 分析 - 自己的数据
      PERMISSIONS.ANALYTICS.VIEW,
    ],
  },

  // ==================== 派单员 ====================
  DISPATCHER: {
    code: 'DISPATCHER',
    name: '派单员',
    description: '负责测量和安装任务的派工调度',
    isSystem: true,
    permissions: [
      // 订单 - 查看所有（用于派工）
      PERMISSIONS.ORDER.ALL_VIEW,
      // 测量 - 派工
      PERMISSIONS.MEASURE.ALL_VIEW,
      PERMISSIONS.MEASURE.DISPATCH,
      // 安装 - 查看 + 派工 + 创建任务
      PERMISSIONS.INSTALL.ALL_VIEW,
      PERMISSIONS.INSTALL.DISPATCH,
      PERMISSIONS.INSTALL.CREATE,
      // 客户 - 查看（用于联系）
      PERMISSIONS.CUSTOMER.ALL_VIEW,
    ],
  },

  // ==================== 采购 ====================
  SUPPLY: {
    code: 'SUPPLY',
    name: '采购',
    description: '负责供应链管理、采购订单和供应商管理',
    isSystem: true,
    permissions: [
      // 订单 - 查看（用于采购计划）
      PERMISSIONS.ORDER.ALL_VIEW,
      // 产品 - 完整权限
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.PRODUCTS.CREATE,
      PERMISSIONS.PRODUCTS.EDIT,
      // 供应链 - 完整权限
      PERMISSIONS.SUPPLY_CHAIN.VIEW,
      PERMISSIONS.SUPPLY_CHAIN.CREATE,
      PERMISSIONS.SUPPLY_CHAIN.EDIT,
      PERMISSIONS.SUPPLY_CHAIN.DELETE,
      PERMISSIONS.SUPPLY_CHAIN.SUPPLIER_MANAGE,
      PERMISSIONS.SUPPLY_CHAIN.STOCK_MANAGE,
      // 财务 - 查看（跟进付款状态）
      PERMISSIONS.FINANCE.VIEW,
      PERMISSIONS.FINANCE.LABOR_VIEW,
      // 分析 - 查看采购相关报表
      PERMISSIONS.ANALYTICS.VIEW,
    ],
  },

  // ==================== 财务 ====================
  FINANCE: {
    code: 'FINANCE',
    name: '财务',
    description: '负责收付款、账单和结算管理',
    isSystem: true,
    permissions: [
      // 订单 - 查看
      PERMISSIONS.ORDER.ALL_VIEW,
      // 客户 - 查看（开票需要客户信息）
      PERMISSIONS.CUSTOMER.ALL_VIEW,
      // 报价 - 查看（核对金额）
      PERMISSIONS.QUOTE.ALL_VIEW,
      // 财务 - 完整权限
      PERMISSIONS.FINANCE.VIEW,
      PERMISSIONS.FINANCE.CREATE,
      PERMISSIONS.FINANCE.EDIT,
      PERMISSIONS.FINANCE.APPROVE,
      PERMISSIONS.FINANCE.LABOR_VIEW,
      PERMISSIONS.FINANCE.RECONCILE,
      // 供应链 - 查看（付款核对）
      PERMISSIONS.SUPPLY_CHAIN.VIEW,
      // 渠道 - 佣金和结算
      PERMISSIONS.CHANNEL.VIEW,
      PERMISSIONS.CHANNEL.COMMISSION,
      PERMISSIONS.CHANNEL.SETTLEMENT,
      // 分析 - 财务相关
      PERMISSIONS.ANALYTICS.VIEW,
      PERMISSIONS.ANALYTICS.EXPORT,
    ],
  },

  // ==================== 工人 ====================
  WORKER: {
    code: 'WORKER',
    name: '工人',
    description: '外勤人员，执行测量和安装任务',
    isSystem: true,
    permissions: [
      // 测量 - 查看自己的 + 编辑（上传数据）+ 完成
      PERMISSIONS.MEASURE.OWN_VIEW,
      PERMISSIONS.MEASURE.COMPLETE,
      // 安装 - 查看自己的 + 编辑（上传照片/备注）+ 完成
      PERMISSIONS.INSTALL.OWN_VIEW,
      PERMISSIONS.INSTALL.COMPLETE,
      // 订单 - 查看分配给自己的
      PERMISSIONS.ORDER.OWN_VIEW,
      // 客户 - 查看自己的（用于联系）
      PERMISSIONS.CUSTOMER.OWN_VIEW,
      // 售后 - 查看分配给自己的返工任务
      PERMISSIONS.AFTER_SALES.OWN_VIEW,
    ],
  },
};

/**
 * 获取角色代码列表
 */
export function getRoleCodes(): string[] {
  return Object.keys(ROLES);
}

/**
 * 获取角色定义
 */
export function getRoleDefinition(code: string): RoleDefinition | undefined {
  return ROLES[code];
}

/**
 * 角色代码到中文名称的映射
 */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: '管理员',
  MANAGER: '经理',
  SALES: '销售',
  DISPATCHER: '派单员',
  SUPPLY: '采购',
  FINANCE: '财务',
  WORKER: '工人',
};

/**
 * 获取角色中文名称
 */
export function getRoleLabel(code: string): string {
  return ROLE_LABELS[code] || code;
}
