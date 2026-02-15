/**
 * 权限检查统一入口
 *
 * 历史遗留：此文件之前硬编码 return true，现已修复为从 auth.ts 重导出。
 * 所有 Server Actions 应从 '@/shared/lib/auth' 导入 checkPermission。
 * 此文件仅作为向后兼容的重导出层。
 */
export { checkPermission } from './auth';
export { RolePermissionService, rolePermissionService } from './role-permission-service';
