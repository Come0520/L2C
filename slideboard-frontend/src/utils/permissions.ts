// 权限检查工具函数

import { User, UserRole, ROLE_PERMISSIONS } from '@/shared/types/user'

/**
 * 检查用户是否具有特定权限
 * @param user 用户对象
 * @param permission 要检查的权限
 * @returns 是否具有权限
 */
export function checkPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  
  // 管理员具有所有权限
  if (user.role === 'admin') return true
  
  // 获取用户角色的权限列表
  const permissions = ROLE_PERMISSIONS[user.role] as unknown as string[]
  
  // 检查是否具有所有权限或特定权限
  return permissions.includes('all') || permissions.includes(permission)
}

/**
 * 检查用户是否具有多个权限中的至少一个
 * @param user 用户对象
 * @param permissions 要检查的权限列表
 * @returns 是否具有至少一个权限
 */
export function checkAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user) return false
  
  // 管理员具有所有权限
  if (user.role === 'admin') return true
  
  // 获取用户角色的权限列表
  const userPermissions = ROLE_PERMISSIONS[user.role] as unknown as string[]
  
  // 检查是否具有所有权限或至少一个特定权限
  if (userPermissions.includes('all')) return true
  
  return permissions.some(permission => userPermissions.includes(permission))
}

/**
 * 检查用户是否为指定角色
 * @param user 用户对象
 * @param roles 要检查的角色列表
 * @returns 是否为指定角色
 */
export function checkRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false
  
  // 管理员匹配所有角色
  if (user.role === 'admin') return true
  
  return roles.includes(user.role)
}

/**
 * 获取用户角色的权限列表
 * @param role 用户角色
 * @returns 权限列表
 */
export function getPermissionsByRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * 获取角色的中文名称
 * @param role 用户角色
 * @returns 角色中文名称
 */
export function getRoleLabel(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    user: '普通用户',
    pro: '专业用户',
    admin: '管理员',
    SALES_STORE: '门店销售',
    SALES_REMOTE: '远程销售',
    SALES_CHANNEL: '渠道销售',
    SERVICE_DISPATCH: '服务调度',
    SERVICE_MEASURE: '测量服务',
    DESIGNER: '设计师',
    CUSTOMER: '客户',
    LEAD_SALES: '销售负责人',
    LEAD_CHANNEL: '渠道负责人',
    LEAD_GENERAL: '领导',
    LEAD_ADMIN: '系统管理员',
    LEAD_VIEWER: '领导查看角色',
    APPROVER_BUSINESS: '业务审批人',
    APPROVER_FINANCIAL: '财务审批人',
    APPROVER_MANAGEMENT: '管理审批人',
    DELIVERY_SERVICE: '订单客服',
    SERVICE_INSTALL: '安装师',
    OTHER_FINANCE: '财务',
    OTHER_CUSTOMER: '客户',
    PARTNER_DESIGNER: '设计师',
    PARTNER_GUIDE: '导购'
  }
  
  return roleLabels[role] || role
}

/**
 * 检查用户是否具有指定角色（兼容旧代码）
 * @param role 用户角色
 * @param requiredRoles 要求的角色列表
 * @returns 是否具有权限
 */
export function hasPermission(role: UserRole | undefined, requiredRoles: UserRole | UserRole[]): boolean {
  if (!role) return false
  
  // 管理员具有所有权限
  if (role === 'admin') return true
  
  // 转换为数组
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  
  // 检查是否匹配任何角色
  return rolesArray.includes(role)
}

/**
 * 检查用户是否为管理员
 * @param role 用户角色
 * @returns 是否为管理员
 */
export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'LEAD_ADMIN'
}

/**
 * 检查用户是否为财务相关角色
 * @param role 用户角色
 * @returns 是否为财务角色
 */
export function isFinance(role: UserRole | undefined): boolean {
  return role === 'OTHER_FINANCE' || role === 'APPROVER_FINANCIAL'
}

/**
 * 检查用户是否为销售相关角色
 * @param role 用户角色
 * @returns 是否为销售角色
 */
export function isSalesRole(role: UserRole | undefined): boolean {
  return [
    'SALES_STORE',
    'SALES_REMOTE',
    'SALES_CHANNEL',
    'LEAD_SALES',
    'LEAD_CHANNEL'
  ].includes(role || '')
}

/**
 * 检查用户是否为服务相关角色
 * @param role 用户角色
 * @returns 是否为服务角色
 */
export function isServiceRole(role: UserRole | undefined): boolean {
  return [
    'SERVICE_DISPATCH',
    'SERVICE_MEASURE',
    'SERVICE_INSTALL',
    'DELIVERY_SERVICE'
  ].includes(role || '')
}
