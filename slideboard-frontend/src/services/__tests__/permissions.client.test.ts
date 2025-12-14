import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ROLE_PERMISSIONS, USER_ROLES } from '@/shared/types/user';

import { permissionsService } from '../permissions.client';

// 模拟依赖
vi.mock('@/shared/types/user', () => ({
  USER_ROLES: {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    USER: 'USER'
  },
  ROLE_PERMISSIONS: {
    ADMIN: ['read:users', 'write:users', 'read:roles', 'write:roles'],
    MANAGER: ['read:users', 'read:roles'],
    USER: ['read:users']
  }
}));

describe('Permissions Client Service', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });

  describe('getRolesAndPermissions', () => {
    it('should return all roles and permissions', async () => {
      // Act
      const result = await permissionsService.getRolesAndPermissions();

      // Assert
      expect(result).toHaveProperty('roles');
      expect(result).toHaveProperty('permissions');
      expect(result.roles).toHaveLength(3);
      expect(result.permissions).toHaveLength(4);
      
      // 检查角色是否正确
      const roleNames = result.roles.map(role => role.name);
      expect(roleNames).toContain('ADMIN');
      expect(roleNames).toContain('MANAGER');
      expect(roleNames).toContain('USER');
      
      // 检查权限是否正确
      const permissionNames = result.permissions.map(perm => perm.name);
      expect(permissionNames).toContain('read:users');
      expect(permissionNames).toContain('write:users');
      expect(permissionNames).toContain('read:roles');
      expect(permissionNames).toContain('write:roles');
      
      // 检查角色权限是否正确
      const adminRole = result.roles.find(role => role.name === 'ADMIN');
      expect(adminRole?.permissions).toEqual(['read:users', 'write:users', 'read:roles', 'write:roles']);
      
      const managerRole = result.roles.find(role => role.name === 'MANAGER');
      expect(managerRole?.permissions).toEqual(['read:users', 'read:roles']);
      
      const userRole = result.roles.find(role => role.name === 'USER');
      expect(userRole?.permissions).toEqual(['read:users']);
    });
  });

  describe('getRoles', () => {
    it('should return all roles', async () => {
      // Act
      const result = await permissionsService.getRoles();

      // Assert
      expect(result).toHaveLength(3);
      const roleNames = result.map(role => role.name);
      expect(roleNames).toContain('ADMIN');
      expect(roleNames).toContain('MANAGER');
      expect(roleNames).toContain('USER');
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions', async () => {
      // Act
      const result = await permissionsService.getPermissions();

      // Assert
      expect(result).toHaveLength(4);
      const permissionNames = result.map(perm => perm.name);
      expect(permissionNames).toContain('read:users');
      expect(permissionNames).toContain('write:users');
      expect(permissionNames).toContain('read:roles');
      expect(permissionNames).toContain('write:roles');
    });
  });

  describe('createRole', () => {
    it('should create a new role with permissions', async () => {
      // Arrange
      const roleName = 'NEW_ROLE';
      const description = 'New role description';
      const permissions = ['read:users', 'read:roles'];

      // Act
      const result = await permissionsService.createRole(roleName, description, permissions);

      // Assert
      expect(result).toEqual({
        id: roleName,
        name: roleName,
        description: description,
        permissions: permissions,
        user_count: 0,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(result.created_at).toBe(result.updated_at);
    });

    it('should create a role with empty permissions', async () => {
      // Arrange
      const roleName = 'EMPTY_ROLE';
      const description = 'Role with no permissions';
      const permissions: string[] = [];

      // Act
      const result = await permissionsService.createRole(roleName, description, permissions);

      // Assert
      expect(result.permissions).toEqual([]);
      expect(result.user_count).toBe(0);
    });
  });
});
