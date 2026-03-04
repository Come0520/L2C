import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerService } from '../customer.service';
import { db } from '../../shared/api/db';
import { customers } from '../../shared/api/schema';
import { AppError, ERROR_CODES } from '../../shared/lib/errors';
import { AuditService } from '../../shared/services/audit-service';

vi.mock('../../shared/api/db', () => ({
  db: {
    query: {
      customers: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn(async (cb) => cb(db)),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'mock-id', level: 'B', version: 2 }]),
    })),
  },
}));

vi.mock('../../shared/services/audit-service', () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../shared/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CustomerService', () => {
  const MOCK_TENANT_ID = 'tenant-1';
  const MOCK_USER_ID = 'user-1';
  const MOCK_CUSTOMER_ID = 'cust-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateCustomer Level Protection', () => {
    it('允许提升客户等级 (D -> A)', async () => {
      // 模拟现有客户等级为 D
      (db.query.customers.findFirst as any).mockResolvedValue({
        id: MOCK_CUSTOMER_ID,
        level: 'D',
        version: 1,
        tenantId: MOCK_TENANT_ID,
      });

      await expect(
        CustomerService.updateCustomer(
          MOCK_CUSTOMER_ID,
          { level: 'A' },
          MOCK_TENANT_ID,
          MOCK_USER_ID,
          1
        )
      ).resolves.not.toThrow();
    });

    it('禁止降低客户等级 (A -> D)', async () => {
      // 模拟现有客户等级为 A
      (db.query.customers.findFirst as any).mockResolvedValue({
        id: MOCK_CUSTOMER_ID,
        level: 'A',
        version: 1,
        tenantId: MOCK_TENANT_ID,
      });

      // 应该抛出 INVALID_OPERATION 错误
      await expect(
        CustomerService.updateCustomer(
          MOCK_CUSTOMER_ID,
          { level: 'D' },
          MOCK_TENANT_ID,
          MOCK_USER_ID,
          1
        )
      ).rejects.toThrow(/不允许降低客户等级/);
    });

    it('允许保持等级不变', async () => {
      (db.query.customers.findFirst as any).mockResolvedValue({
        id: MOCK_CUSTOMER_ID,
        level: 'B',
        version: 1,
        tenantId: MOCK_TENANT_ID,
      });

      await expect(
        CustomerService.updateCustomer(
          MOCK_CUSTOMER_ID,
          { level: 'B' },
          MOCK_TENANT_ID,
          MOCK_USER_ID,
          1
        )
      ).resolves.not.toThrow();
    });
  });
});
