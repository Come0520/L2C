/**
 * L2C 系统统一角色枚举与系统鉴权全集配置 (Shared Role Definitions)
 */

/**
 * 核心基础角色标识 (系统内置，与 Database `user_role` Enum 严格一致)
 */
export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // 平台超级管理员
  BOSS = 'BOSS', // 企业老板（全业务视野、不可降级）
  ADMIN = 'ADMIN', // 租户管理员（维护字典、员工等）
  MANAGER = 'MANAGER', // 经理/店长/区域经理
  DISPATCHER = 'DISPATCHER', // 派单员
  SALES = 'SALES', // 销售
  FINANCE = 'FINANCE', // 财务
  WORKER = 'WORKER', // 师傅（含量尺/安装工）
  CUSTOMER = 'CUSTOMER', // 客户
  SUPPLY = 'SUPPLY', // 供应链/采购
}

/**
 * 角色集合别名别称映射（用于全局守卫、API 中间件统一鉴权）
 */
export const ROLE_ALIASES = {
  /**
   * 销售及以上管理（能跟单、转单、录线索等）
   */
  SALES_AND_ABOVE: [SystemRole.BOSS, SystemRole.ADMIN, SystemRole.MANAGER, SystemRole.SALES],

  /**
   * 高管、门店/大区管理层（可看报表、分配任务、强管控）
   */
  MANAGEMENT: [SystemRole.BOSS, SystemRole.ADMIN, SystemRole.MANAGER],

  /**
   * 仅限工人师傅体系（能操作安装/测量工单、提交完工）
   */
  WORKER_ONLY: [SystemRole.WORKER],

  /**
   * 财务审计、审批、回款集合
   */
  FINANCE_AND_ABOVE: [SystemRole.BOSS, SystemRole.ADMIN, SystemRole.FINANCE],

  /**
   * 内部全职员工基础集合（排除外部 C 端客户与外部供应链）
   */
  INTERNAL_STAFF: [
    SystemRole.BOSS,
    SystemRole.ADMIN,
    SystemRole.MANAGER,
    SystemRole.DISPATCHER,
    SystemRole.SALES,
    SystemRole.FINANCE,
    SystemRole.WORKER,
  ],
} as const;

export type SystemRoleType = `${SystemRole}`;
