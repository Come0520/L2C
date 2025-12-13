import { vi } from 'vitest';

import { UserRole } from '@/shared/types/user';

import {
  checkPermission,
  checkAnyPermission,
  checkRole,
  getPermissionsByRole,
  getRoleLabel,
  hasPermission,
  isAdmin,
  isFinance,
  isSalesRole,
  isServiceRole
} from '../permissions';

// Mock the ROLE_PERMISSIONS constant
vi.mock('@/shared/types/user', () => ({
  ROLE_PERMISSIONS: {
    admin: ['all'],
    SALES_STORE: ['lead_create', 'lead_edit', 'lead_view'],
    SALES_REMOTE: ['lead_edit', 'lead_view'],
    SERVICE_DISPATCH: ['service_assign', 'service_schedule'],
    SERVICE_MEASURE: ['service_measure', 'service_report'],
    SERVICE_INSTALL: ['service_install', 'service_confirm'],
    OTHER_FINANCE: ['finance_view', 'finance_approve'],
    APPROVER_FINANCIAL: ['finance_approve'],
    LEAD_SALES: ['lead_manage', 'report_view'],
    LEAD_CHANNEL: ['channel_manage', 'report_view'],
    DESIGNER: ['design_create', 'design_edit'],
    DELIVERY_SERVICE: ['delivery_track', 'delivery_update'],
    user: ['basic_view'],
    pro: ['basic_view', 'pro_features']
  },
  UserRole: {
    admin: 'admin',
    SALES_STORE: 'SALES_STORE',
    SALES_REMOTE: 'SALES_REMOTE',
    SERVICE_DISPATCH: 'SERVICE_DISPATCH',
    SERVICE_MEASURE: 'SERVICE_MEASURE',
    SERVICE_INSTALL: 'SERVICE_INSTALL',
    OTHER_FINANCE: 'OTHER_FINANCE',
    APPROVER_FINANCIAL: 'APPROVER_FINANCIAL',
    LEAD_SALES: 'LEAD_SALES',
    LEAD_CHANNEL: 'LEAD_CHANNEL',
    DESIGNER: 'DESIGNER',
    DELIVERY_SERVICE: 'DELIVERY_SERVICE',
    user: 'user',
    pro: 'pro'
  },
  OperationPermission: {
    lead_create: 'lead_create',
    lead_edit: 'lead_edit',
    lead_view: 'lead_view',
    service_assign: 'service_assign',
    service_schedule: 'service_schedule',
    service_measure: 'service_measure',
    service_report: 'service_report',
    service_install: 'service_install',
    service_confirm: 'service_confirm',
    finance_view: 'finance_view',
    finance_approve: 'finance_approve',
    lead_manage: 'lead_manage',
    report_view: 'report_view',
    channel_manage: 'channel_manage',
    design_create: 'design_create',
    design_edit: 'design_edit',
    delivery_track: 'delivery_track',
    delivery_update: 'delivery_update',
    basic_view: 'basic_view',
    pro_features: 'pro_features'
  }
}));

describe('Permissions', () => {
  const mockAdminUser = {
    id: 'admin-user-id',
    phone: '000-0000',
    role: 'admin' as UserRole,
    name: 'Admin User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockSalesUser = {
    id: 'sales-user-id',
    phone: '000-0001',
    role: 'SALES_STORE' as UserRole,
    name: 'Sales User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockServiceUser = {
    id: 'service-user-id',
    phone: '000-0002',
    role: 'SERVICE_DISPATCH' as UserRole,
    name: 'Service User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockFinanceUser = {
    id: 'finance-user-id',
    phone: '000-0003',
    role: 'OTHER_FINANCE' as UserRole,
    name: 'Finance User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  describe('checkPermission', () => {
    it('should return true for admin user with any permission', () => {
      expect(checkPermission(mockAdminUser, 'lead_create')).toBe(true);
      expect(checkPermission(mockAdminUser, 'finance_approve')).toBe(true);
      expect(checkPermission(mockAdminUser, 'service_install')).toBe(true);
    });

    it('should return true when user has the specific permission', () => {
      expect(checkPermission(mockSalesUser, 'lead_create')).toBe(true);
      expect(checkPermission(mockServiceUser, 'service_assign')).toBe(true);
      expect(checkPermission(mockFinanceUser, 'finance_view')).toBe(true);
    });

    it('should return false when user does not have the permission', () => {
      expect(checkPermission(mockSalesUser, 'finance_approve')).toBe(false);
      expect(checkPermission(mockServiceUser, 'lead_create')).toBe(false);
      expect(checkPermission(mockFinanceUser, 'service_install')).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(checkPermission(null, 'lead_create')).toBe(false);
    });
  });

  describe('checkAnyPermission', () => {
    it('should return true when user has any of the permissions', () => {
      expect(checkAnyPermission(mockSalesUser, ['lead_create', 'lead_edit'])).toBe(true);
      expect(checkAnyPermission(mockServiceUser, ['service_assign', 'service_schedule'])).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      expect(checkAnyPermission(mockSalesUser, ['finance_approve', 'service_install'])).toBe(false);
    });

    it('should return true for admin user', () => {
      expect(checkAnyPermission(mockAdminUser, ['any_permission', 'another_permission'])).toBe(true);
    });
  });

  describe('checkRole', () => {
    it('should return true when user has the specified role', () => {
      expect(checkRole(mockSalesUser, ['SALES_STORE'])).toBe(true);
      expect(checkRole(mockServiceUser, ['SERVICE_DISPATCH'])).toBe(true);
      expect(checkRole(mockFinanceUser, ['OTHER_FINANCE'])).toBe(true);
    });

    it('should return true when user matches any of the roles', () => {
      expect(checkRole(mockSalesUser, ['SALES_STORE', 'SALES_REMOTE'])).toBe(true);
      expect(checkRole(mockServiceUser, ['SERVICE_DISPATCH', 'SERVICE_MEASURE'])).toBe(true);
    });

    it('should return true for admin user matching any role', () => {
      expect(checkRole(mockAdminUser, ['SALES_STORE', 'OTHER_FINANCE'])).toBe(true);
    });

    it('should return false when user does not match any role', () => {
      expect(checkRole(mockSalesUser, ['SERVICE_DISPATCH', 'OTHER_FINANCE'])).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the required role', () => {
      expect(hasPermission('admin', 'admin')).toBe(true);
      expect(hasPermission('SALES_STORE', 'SALES_STORE')).toBe(true);
      expect(hasPermission('OTHER_FINANCE', 'OTHER_FINANCE')).toBe(true);
    });

    it('should return true when user matches any of the required roles', () => {
      expect(hasPermission('SALES_STORE', ['SALES_STORE', 'SALES_REMOTE'])).toBe(true);
      expect(hasPermission('SERVICE_MEASURE', ['SERVICE_MEASURE', 'SERVICE_INSTALL'])).toBe(true);
    });

    it('should return true for admin user with any role', () => {
      expect(hasPermission('admin', 'SALES_STORE')).toBe(true);
      expect(hasPermission('admin', ['SERVICE_DISPATCH', 'OTHER_FINANCE'])).toBe(true);
    });

    it('should return false when user does not match the role', () => {
      expect(hasPermission('SALES_STORE', 'OTHER_FINANCE')).toBe(false);
      expect(hasPermission('SERVICE_DISPATCH', ['DESIGNER', 'DELIVERY_SERVICE'])).toBe(false);
    });

    it('should return false when role is undefined', () => {
      expect(hasPermission(undefined, 'SALES_STORE')).toBe(false);
      expect(hasPermission(undefined, ['SALES_STORE', 'SALES_REMOTE'])).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      expect(isAdmin('admin')).toBe(true);
      expect(isAdmin('LEAD_ADMIN')).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      expect(isAdmin('SALES_STORE')).toBe(false);
      expect(isAdmin('OTHER_FINANCE')).toBe(false);
      expect(isAdmin('SERVICE_DISPATCH')).toBe(false);
    });

    it('should return false when role is undefined', () => {
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe('isFinance', () => {
    it('should return true for finance-related roles', () => {
      expect(isFinance('OTHER_FINANCE')).toBe(true);
      expect(isFinance('APPROVER_FINANCIAL')).toBe(true);
    });

    it('should return false for non-finance roles', () => {
      expect(isFinance('SALES_STORE')).toBe(false);
      expect(isFinance('SERVICE_DISPATCH')).toBe(false);
      expect(isFinance('DESIGNER')).toBe(false);
    });

    it('should return false when role is undefined', () => {
      expect(isFinance(undefined)).toBe(false);
    });
  });

  describe('isSalesRole', () => {
    it('should return true for sales roles', () => {
      expect(isSalesRole('SALES_STORE')).toBe(true);
      expect(isSalesRole('SALES_REMOTE')).toBe(true);
      expect(isSalesRole('SALES_CHANNEL')).toBe(true);
      expect(isSalesRole('LEAD_SALES')).toBe(true);
      expect(isSalesRole('LEAD_CHANNEL')).toBe(true);
    });

    it('should return false for non-sales roles', () => {
      expect(isSalesRole('SERVICE_DISPATCH')).toBe(false);
      expect(isSalesRole('OTHER_FINANCE')).toBe(false);
      expect(isSalesRole('DESIGNER')).toBe(false);
    });

    it('should return false when role is undefined', () => {
      expect(isSalesRole(undefined)).toBe(false);
    });
  });

  describe('isServiceRole', () => {
    it('should return true for service roles', () => {
      expect(isServiceRole('SERVICE_DISPATCH')).toBe(true);
      expect(isServiceRole('SERVICE_MEASURE')).toBe(true);
      expect(isServiceRole('SERVICE_INSTALL')).toBe(true);
      expect(isServiceRole('DELIVERY_SERVICE')).toBe(true);
    });

    it('should return false for non-service roles', () => {
      expect(isServiceRole('SALES_STORE')).toBe(false);
      expect(isServiceRole('OTHER_FINANCE')).toBe(false);
      expect(isServiceRole('DESIGNER')).toBe(false);
    });

    it('should return false when role is undefined', () => {
      expect(isServiceRole(undefined)).toBe(false);
    });
  });

  describe('getPermissionsByRole', () => {
    it('should return permissions for admin role', () => {
      const permissions = getPermissionsByRole('admin' as UserRole);
      expect(permissions).toEqual(['all']);
    });

    it('should return permissions for sales store role', () => {
      const permissions = getPermissionsByRole('SALES_STORE' as UserRole);
      expect(permissions).toEqual(['lead_create', 'lead_edit', 'lead_view']);
    });

    it('should return permissions for service dispatch role', () => {
      const permissions = getPermissionsByRole('SERVICE_DISPATCH' as UserRole);
      expect(permissions).toEqual(['service_assign', 'service_schedule']);
    });

    it('should return permissions for finance role', () => {
      const permissions = getPermissionsByRole('OTHER_FINANCE' as UserRole);
      expect(permissions).toEqual(['finance_view', 'finance_approve']);
    });

    it('should return empty array for unknown role', () => {
      const permissions = getPermissionsByRole('unknown_role' as UserRole);
      expect(permissions).toEqual([]);
    });
  });

  describe('getRoleLabel', () => {
    it('should return correct label for admin role', () => {
      expect(getRoleLabel('admin' as UserRole)).toBe('管理员');
    });

    it('should return correct label for sales roles', () => {
      expect(getRoleLabel('SALES_STORE' as UserRole)).toBe('门店销售');
      expect(getRoleLabel('SALES_REMOTE' as UserRole)).toBe('远程销售');
      expect(getRoleLabel('LEAD_SALES' as UserRole)).toBe('销售负责人');
    });

    it('should return correct label for service roles', () => {
      expect(getRoleLabel('SERVICE_DISPATCH' as UserRole)).toBe('服务调度');
      expect(getRoleLabel('SERVICE_MEASURE' as UserRole)).toBe('测量服务');
      expect(getRoleLabel('SERVICE_INSTALL' as UserRole)).toBe('安装师');
    });

    it('should return correct label for finance roles', () => {
      expect(getRoleLabel('OTHER_FINANCE' as UserRole)).toBe('财务');
      expect(getRoleLabel('APPROVER_FINANCIAL' as UserRole)).toBe('财务审批人');
    });

    it('should return role name for unknown role', () => {
      expect(getRoleLabel('unknown_role' as UserRole)).toBe('unknown_role');
    });
  });

  describe('Role Permission Combinations', () => {
    it('should correctly handle role-specific permissions', () => {
      // 测试门店销售权限
      expect(checkPermission(
        { id: 'store-sales', phone: '000-0100', role: 'SALES_STORE', name: 'Store Sales', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        'lead_create'
      )).toBe(true);
      
      // 测试远程销售权限
      expect(checkPermission(
        { id: 'remote-sales', phone: '000-0101', role: 'SALES_REMOTE', name: 'Remote Sales', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        'lead_create'
      )).toBe(false);
      
      // 测试测量师权限
      expect(checkPermission(
        { id: 'measurer', phone: '000-0102', role: 'SERVICE_MEASURE', name: 'Measurer', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        'service_measure'
      )).toBe(true);
      
      // 测试安装师权限
      expect(checkPermission(
        { id: 'installer', phone: '000-0103', role: 'SERVICE_INSTALL', name: 'Installer', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        'service_confirm'
      )).toBe(true);
    });

    it('should correctly handle admin permissions', () => {
      // 管理员应该拥有所有权限
      const adminUser = { id: 'admin', phone: '000-9999', role: 'admin' as UserRole, name: 'Admin', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' };
      
      expect(checkPermission(adminUser, 'lead_create')).toBe(true);
      expect(checkPermission(adminUser, 'service_install')).toBe(true);
      expect(checkPermission(adminUser, 'finance_approve')).toBe(true);
      expect(checkPermission(adminUser, 'report_view')).toBe(true);
    });

    it('should correctly handle role hierarchies', () => {
      // 销售负责人应该能管理线索
      expect(checkPermission(
        { id: 'sales-lead', phone: '000-0200', role: 'LEAD_SALES', name: 'Sales Lead', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        'lead_manage'
      )).toBe(true);
      
      // 普通销售应该不能管理线索
      expect(checkPermission(
        { id: 'store-sales', phone: '000-0100', role: 'SALES_STORE', name: 'Store Sales', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        'lead_manage'
      )).toBe(false);
    });
  });

  describe('8 Role Types Validation', () => {
    const eightRoleTypes = [
      'SALES_STORE', // 门店销售
      'SALES_REMOTE', // 远程销售
      'SERVICE_DISPATCH', // 服务调度
      'SERVICE_MEASURE', // 测量师
      'SERVICE_INSTALL', // 安装师
      'OTHER_FINANCE', // 财务
      'LEAD_SALES', // 销售负责人
      'DESIGNER' // 设计师
    ];

    it('should have exactly 8 distinct role types', () => {
      expect(eightRoleTypes.length).toBe(8);
      const uniqueRoles = new Set(eightRoleTypes);
      expect(uniqueRoles.size).toBe(8);
    });

    it('should validate all 8 role types have permissions', () => {
      eightRoleTypes.forEach(role => {
        const permissions = getPermissionsByRole(role as UserRole);
        expect(permissions.length).toBeGreaterThan(0);
      });
    });
  });
});
