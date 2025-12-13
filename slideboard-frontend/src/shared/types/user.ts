// 用户角色类型
export type UserRole = 
  | 'user' 
  | 'pro' 
  | 'admin' 
  | 'SALES_STORE' 
  | 'SALES_REMOTE' 
  | 'SALES_CHANNEL' 
  | 'SERVICE_DISPATCH' 
  | 'SERVICE_MEASURE' 
  | 'SERVICE_INSTALL' 
  | 'DESIGNER' 
  | 'CUSTOMER' 
  | 'LEAD_SALES' 
  | 'LEAD_CHANNEL' 
  | 'LEAD_GENERAL' 
  | 'LEAD_ADMIN' 
  | 'LEAD_VIEWER' 
  | 'APPROVER_BUSINESS' 
  | 'APPROVER_FINANCIAL' 
  | 'APPROVER_MANAGEMENT' 
  | 'DELIVERY_SERVICE' 
  | 'OTHER_FINANCE' 
  | 'OTHER_CUSTOMER' 
  | 'PARTNER_DESIGNER' 
  | 'PARTNER_GUIDE'

// 用户相关类型
export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// 权限常量
export const USER_ROLES = {
  USER: 'user',
  PRO: 'pro',
  ADMIN: 'admin',
  SALES_STORE: 'SALES_STORE',
  SALES_REMOTE: 'SALES_REMOTE',
  SALES_CHANNEL: 'SALES_CHANNEL',
  SERVICE_DISPATCH: 'SERVICE_DISPATCH',
  SERVICE_MEASURE: 'SERVICE_MEASURE',
  SERVICE_INSTALL: 'SERVICE_INSTALL',
  DESIGNER: 'DESIGNER',
  CUSTOMER: 'CUSTOMER',
  LEAD_SALES: 'LEAD_SALES',
  LEAD_CHANNEL: 'LEAD_CHANNEL',
  LEAD_GENERAL: 'LEAD_GENERAL',
  LEAD_ADMIN: 'LEAD_ADMIN',
  LEAD_VIEWER: 'LEAD_VIEWER',
  APPROVER_BUSINESS: 'APPROVER_BUSINESS',
  APPROVER_FINANCIAL: 'APPROVER_FINANCIAL',
  APPROVER_MANAGEMENT: 'APPROVER_MANAGEMENT',
  DELIVERY_SERVICE: 'DELIVERY_SERVICE',
  OTHER_FINANCE: 'OTHER_FINANCE',
  OTHER_CUSTOMER: 'OTHER_CUSTOMER',
  PARTNER_DESIGNER: 'PARTNER_DESIGNER',
  PARTNER_GUIDE: 'PARTNER_GUIDE'
} as const

// 操作权限类型
export type OperationPermission = 
  | 'view_measurements' 
  | 'create_measurements' 
  | 'update_measurements' 
  | 'delete_measurements' 
  | 'assign_measurements' 
  | 'upload_measurement_reports' 
  | 'download_measurement_reports' 
  | 'rate_measurements' 
  | 'approve_measurements' 
  | 'manage_templates' 
  | 'view_analytics' 
  | 'manage_users' 
  | 'manage_roles' 
  | 'all'

// 权限映射
export const ROLE_PERMISSIONS: Record<UserRole, OperationPermission[]> = {
  user: ['view_measurements'],
  pro: ['view_measurements', 'create_measurements'],
  admin: ['all'],
  SALES_STORE: ['view_measurements', 'create_measurements', 'update_measurements'],
  SALES_REMOTE: ['view_measurements', 'create_measurements'],
  SALES_CHANNEL: ['view_measurements', 'create_measurements'],
  SERVICE_DISPATCH: ['view_measurements', 'assign_measurements', 'update_measurements'],
  SERVICE_MEASURE: ['view_measurements', 'update_measurements', 'upload_measurement_reports', 'download_measurement_reports'],
  SERVICE_INSTALL: ['view_measurements', 'update_measurements'],
  DESIGNER: ['view_measurements'],
  CUSTOMER: ['view_measurements', 'rate_measurements'],
  LEAD_SALES: ['view_measurements', 'create_measurements', 'update_measurements', 'approve_measurements', 'view_analytics'],
  LEAD_CHANNEL: ['view_measurements', 'create_measurements', 'update_measurements', 'approve_measurements', 'view_analytics'],
  LEAD_GENERAL: ['view_measurements', 'approve_measurements', 'view_analytics'],
  LEAD_ADMIN: ['all'],
  LEAD_VIEWER: ['view_measurements', 'view_analytics'],
  APPROVER_BUSINESS: ['view_measurements', 'approve_measurements'],
  APPROVER_FINANCIAL: ['view_measurements', 'approve_measurements'],
  APPROVER_MANAGEMENT: ['view_measurements', 'approve_measurements'],
  DELIVERY_SERVICE: ['view_measurements', 'update_measurements'],
  OTHER_FINANCE: ['view_measurements', 'approve_measurements'],
  OTHER_CUSTOMER: ['view_measurements'],
  PARTNER_DESIGNER: ['view_measurements'],
  PARTNER_GUIDE: ['view_measurements']
} as const