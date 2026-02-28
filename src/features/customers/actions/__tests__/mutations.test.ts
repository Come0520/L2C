/**
 * 客户模块 Server Actions 集成测试 (Mutations)
 *
 * 覆盖范围：
 * - createCustomer（委托 CustomerService）
 * - deleteCustomer（软删除）
 * - addCustomerAddress（事务 + 默认地址切换）
 * - deleteCustomerAddress（租户隔离校验）
 * - setDefaultAddress（事务内批量重置）
 * - updateCustomerAddress（事务内租户校验）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock 定义（vi.hoisted 确保提升） ──
const {
  MOCK_TENANT_ID,
  MOCK_USER_ID,
  MOCK_CUSTOMER_ID,
  MOCK_ADDR_ID,
  mockDbInsert,
  mockDbUpdate,
  mockDbDelete,
  mockDbQuery,
  mockTx,
} = vi.hoisted(() => {
  const TNT_ID = '880e8400-e29b-41d4-a716-446655440000';
  const USR_ID = '990e8400-e29b-41d4-a716-446655440000';
  const CUS_ID = '110e8400-e29b-41d4-a716-446655440000';
  const ADDR_ID = '220e8400-e29b-41d4-a716-446655440000';

  const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
  };
  const mockDeleteChain = {
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'deleted-id' }]),
  };
  const insertFn = vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
    })),
  }));
  const updateFn = vi.fn(() => mockUpdateChain);
  const deleteFn = vi.fn(() => mockDeleteChain);
  const queryObj = {
    customers: { findFirst: vi.fn(), findMany: vi.fn() },
    customerAddresses: { findFirst: vi.fn(), findMany: vi.fn() },
    customerActivities: { findFirst: vi.fn(), findMany: vi.fn() },
  };
  // 事务内的 Mock 对象
  const txUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
  };
  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi
          .fn()
          .mockResolvedValue([
            { id: ADDR_ID, customerId: CUS_ID, address: 'Test', isDefault: true },
          ]),
      })),
    })),
    update: vi.fn(() => txUpdateChain),
    delete: vi.fn(() => ({ where: vi.fn() })),
    query: {
      customerAddresses: { findFirst: vi.fn() },
    },
  };
  return {
    MOCK_TENANT_ID: TNT_ID,
    MOCK_USER_ID: USR_ID,
    MOCK_CUSTOMER_ID: CUS_ID,
    MOCK_ADDR_ID: ADDR_ID,
    mockDbInsert: insertFn,
    mockDbUpdate: updateFn,
    mockDbDelete: deleteFn,
    mockDbQuery: queryObj,
    mockTx: tx,
  };
});

vi.mock('@/shared/api/db', () => ({
  db: {
    query: mockDbQuery,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
    transaction: vi.fn(async (cb) => cb(mockTx)),
  },
}));

vi.mock('@/shared/api/schema', () => ({
  customers: {
    id: 'customers.id',
    tenantId: 'customers.tenantId',
    deletedAt: 'customers.deletedAt',
  },
  customerAddresses: {
    id: 'ca.id',
    customerId: 'ca.customerId',
    tenantId: 'ca.tenantId',
    isDefault: 'ca.isDefault',
  },
  customerActivities: { id: 'act.id', customerId: 'act.customerId', tenantId: 'act.tenantId' },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID, roles: ['ADMIN'] },
  }),
  checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../../shared/services/audit-service', () => ({
  AuditService: { log: vi.fn(), recordFromSession: vi.fn() },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/utils', () => ({
  trimInput: vi.fn((v: unknown) => v),
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/shared/lib/errors', () => ({
  AppError: class AppError extends Error {
    code: string;
    statusCode: number;
    constructor(msg: string, code: string, statusCode: number) {
      super(msg);
      this.code = code;
      this.statusCode = statusCode;
    }
  },
  ERROR_CODES: {
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
    INVALID_OPERATION: 'INVALID_OPERATION',
  },
}));

// Mock CustomerService（createCustomer/updateCustomer/deleteCustomer 均委托给它）
vi.mock('@/services/customer.service', () => ({
  CustomerService: {
    createCustomer: vi.fn().mockResolvedValue({
      isDuplicate: false,
      customer: { id: MOCK_CUSTOMER_ID, name: '测试客户', customerNo: 'C001' },
    }),
    updateCustomer: vi.fn().mockResolvedValue({ id: MOCK_CUSTOMER_ID }),
    deleteCustomer: vi.fn().mockResolvedValue(undefined),
    mergeCustomers: vi.fn().mockResolvedValue({ success: true }),
    previewMerge: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/shared/config/permissions', () => ({
  PERMISSIONS: {
    CUSTOMER: {
      OWN_EDIT: 'customer.own.edit', // 替代废弃的 CREATE 和 EDIT
      OWN_VIEW: 'customer.own.view',
      ALL_EDIT: 'customer.all.edit',
      ALL_VIEW: 'customer.all.view',
      DELETE: 'customer.delete',
      VIEW: 'customer.view',
      MERGE: 'customer.merge', // 替代废弃的 MANAGE
    },
  },
}));

import { AuditService } from '../../../../shared/services/audit-service';
import { CustomerService } from '../../../../services/customer.service';

// ── 测试套件 ──
describe('Customers Mutations (L5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置事务内 Mock 的默认行为
    mockDbQuery.customers.findFirst.mockResolvedValue({
      id: MOCK_CUSTOMER_ID,
      tenantId: MOCK_TENANT_ID,
      version: 1,
    });
    mockDbQuery.customerAddresses.findFirst.mockResolvedValue({
      id: MOCK_ADDR_ID,
      customerId: MOCK_CUSTOMER_ID,
      tenantId: MOCK_TENANT_ID,
      version: 1,
    });
    mockTx.query.customerAddresses.findFirst.mockResolvedValue({
      id: MOCK_ADDR_ID,
      customerId: MOCK_CUSTOMER_ID,
      tenantId: MOCK_TENANT_ID,
      version: 1,
    });
  });

  it('createCustomer 应委托 CustomerService 并返回新客户', async () => {
    const { createCustomer } = await import('../mutations');
    const result = await createCustomer({
      name: '测试客户',
      phone: '13800138000',
      type: 'INDIVIDUAL',
      level: 'A',
      lifecycleStage: 'LEAD',
      pipelineStatus: 'UNASSIGNED',
    });
    expect(CustomerService.createCustomer).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ id: MOCK_CUSTOMER_ID, name: '测试客户' }));
  });

  it('deleteCustomer 应委托 CustomerService 执行软删除', async () => {
    const { deleteCustomer } = await import('../mutations');
    await deleteCustomer(MOCK_CUSTOMER_ID);
    expect(CustomerService.deleteCustomer).toHaveBeenCalledWith(
      MOCK_CUSTOMER_ID,
      MOCK_TENANT_ID,
      MOCK_USER_ID
    );
  });

  it('addCustomerAddress 应在事务中创建地址并记录审计日志', async () => {
    const { addCustomerAddress } = await import('../mutations');
    const result = await addCustomerAddress({
      customerId: MOCK_CUSTOMER_ID,
      address: '上海市浦东新区',
      isDefault: true,
    });
    expect(result).toEqual(expect.objectContaining({ id: MOCK_ADDR_ID }));
    expect(AuditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tableName: 'customer_addresses',
        action: 'CREATE',
        tenantId: MOCK_TENANT_ID,
      })
    );
  });

  it('deleteCustomerAddress 应校验租户隔离后执行删除', async () => {
    const { deleteCustomerAddress } = await import('../mutations');
    await deleteCustomerAddress(MOCK_ADDR_ID);
    expect(AuditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tableName: 'customer_addresses',
        action: 'DELETE',
        recordId: MOCK_ADDR_ID,
      })
    );
  });

  it('setDefaultAddress 应在事务内重置旧默认并设置新默认', async () => {
    const { setDefaultAddress } = await import('../mutations');
    await setDefaultAddress(MOCK_ADDR_ID, MOCK_CUSTOMER_ID);
    // 事务内 update 应被调用两次：1.重置旧默认 2.设置新默认
    expect(mockTx.update).toHaveBeenCalledTimes(2);
    expect(AuditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tableName: 'customer_addresses',
        action: 'UPDATE',
        details: expect.objectContaining({ type: 'SET_DEFAULT' }),
      })
    );
  });

  it('updateCustomerAddress 应在事务内校验地址归属并更新', async () => {
    const { updateCustomerAddress } = await import('../mutations');
    await updateCustomerAddress({
      id: MOCK_ADDR_ID,
      address: '北京市朝阳区',
    });
    expect(AuditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tableName: 'customer_addresses',
        action: 'UPDATE',
        recordId: MOCK_ADDR_ID,
      })
    );
  });
});
