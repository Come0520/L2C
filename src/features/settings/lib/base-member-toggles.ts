/**
 * Base 版套餐成员权限虚拟开关模块
 * 将角色和权限标志映射为对用户友好的布尔开关，用于 Base 版租户的简化权限配置
 */

/** Base 版成员权限虚拟开关 */
export interface BaseMemberToggles {
  /** 是否为合伙人（销售角色） */
  isPartner: boolean;
  /** 是否可访问财务模块 */
  allowFinance: boolean;
  /** 是否可访问派工模块 */
  allowDispatch: boolean;
  /** 是否可访问供应链模块 */
  allowSupply: boolean;
  /** 是否可跨门店共享展厅 */
  allowStoreSharing: boolean;
}

/** 开关默认值（最小权限原则） */
export const DEFAULT_TOGGLES: BaseMemberToggles = {
  isPartner: false,
  allowFinance: false,
  allowDispatch: false,
  allowSupply: false,
  allowStoreSharing: false,
};

/**
 * 将角色列表 + 权限标志 → BaseMemberToggles 布尔开关
 * 用于从现有用户数据反推开关的初始展示状态
 */
export function rolesToToggles(roles: string[], permissions: string[] = []): BaseMemberToggles {
  return {
    isPartner: roles.includes('SALES') || roles.includes('PARTNER'),
    allowFinance: roles.includes('FINANCE') || permissions.includes('view:finance'),
    allowDispatch: roles.includes('DISPATCHER') || permissions.includes('view:dispatch'),
    allowSupply: roles.includes('SUPPLY') || permissions.includes('view:supply'),
    allowStoreSharing: permissions.includes('view:store_sharing'),
  };
}

/**
 * 将 BaseMemberToggles 开关 → 角色列表
 * 用于提交时将开关状态转换为后端所需的角色数组
 */
export function togglesToRoles(toggles: BaseMemberToggles): string[] {
  const roles: string[] = ['STAFF'];
  if (toggles.isPartner) roles.push('SALES');
  if (toggles.allowFinance) roles.push('FINANCE');
  if (toggles.allowDispatch) roles.push('DISPATCHER');
  if (toggles.allowSupply) roles.push('SUPPLY');
  return roles;
}

/**
 * 将 BaseMemberToggles 开关 → 权限标志数组
 * 返回需要额外赋予的细粒度权限
 */
export function togglesToPermissionFlags(toggles: BaseMemberToggles): string[] {
  const flags: string[] = [];
  if (toggles.allowFinance) flags.push('view:finance');
  if (toggles.allowDispatch) flags.push('view:dispatch');
  if (toggles.allowSupply) flags.push('view:supply');
  if (toggles.allowStoreSharing) flags.push('view:store_sharing');
  return flags;
}
