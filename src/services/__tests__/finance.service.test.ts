import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceService } from '../finance.service';
import { db } from '@/shared/api/db';
import { eq, and } from 'drizzle-orm';
import {
  paymentOrders,
  financeAccounts,
  accountTransactions,
  arStatements,
} from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';

// Mock DB
vi.mock('@/shared/api/db', () => ({
  db: {
    transaction: vi.fn(async (cb) => {
      const tx = {
        query: {
          paymentOrders: { findFirst: vi.fn() },
          financeAccounts: { findFirst: vi.fn() },
          arStatements: { findFirst: vi.fn() },
        },
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: '*' }]),
        })),
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: '*' }]),
        })),
      };
      return await cb(tx);
    }),
  },
}));

vi.mock('@/features/channels/logic/commission.service', () => ({
  checkAndGenerateCommission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/lib/generate-no', () => ({
  generateBusinessNo: vi.fn(() => 'TEST-NO-F-123'),
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/features/finance/services/finance-config-utils', () => ({
  getFinanceConfigCached: vi.fn().mockResolvedValue({}),
  isWithinAllowedDifference: vi.fn(() => false),
}));

describe('FinanceService (Finance TDD - Concurrency)', () => {
  const mockTenantId = 'tenant-f';
  const mockUserId = 'user-f';
  const mockOrderId = 'pay-order-123';
  const mockAccountId = 'acc-f-123';
  const mockStatementId = 'stat-f-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[F4] should throw error when financeAccounts optimistic lock fails (returning 0 rows)', async () => {
    vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
      const tx: any = {
        query: {
          paymentOrders: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockOrderId,
              tenantId: mockTenantId,
              accountId: mockAccountId,
              status: 'PENDING',
              totalAmount: '2000.00',
              items: [],
            }),
          },
          financeAccounts: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockAccountId,
              tenantId: mockTenantId,
              balance: '1500.00',
            }),
          },
        },
        update: vi.fn().mockImplementation((table) => {
          const chain = {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            // SIMULATE LOCK FAILURE
            returning: vi.fn().mockResolvedValue(table === financeAccounts ? [] : [{ id: '*' }]),
          };
          return chain;
        }),
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: '*' }]),
        })),
      };
      return await cb(tx);
    });

    // Currently, verifyPaymentOrder doesn't even HAVE a lock or .returning()
    // Wait until we run the test, it will "pass" successfully instead of throwing.
    await expect(
      FinanceService.verifyPaymentOrder(mockOrderId, 'VERIFIED', mockTenantId, mockUserId)
    ).rejects.toThrow('账户资金状态已过期');
  });

  it('[F5] should throw error when arStatements optimistic lock fails (returning 0 rows)', async () => {
    vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
      const tx: any = {
        query: {
          paymentOrders: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockOrderId,
              tenantId: mockTenantId,
              accountId: null,
              status: 'PENDING',
              totalAmount: '500.00',
              items: [
                {
                  orderId: 'biz-order-123',
                  amount: '500.00',
                },
              ],
            }),
          },
          arStatements: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockStatementId,
              tenantId: mockTenantId,
              receivedAmount: '100.00',
              totalAmount: '600.00',
              status: 'PARTIAL',
              channelId: null,
            }),
          },
        },
        update: vi.fn().mockImplementation((table) => {
          return {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            // SIMULATE LOCK FAILURE
            returning: vi.fn().mockResolvedValue(table === arStatements ? [] : [{ id: '*' }]),
          };
        }),
        insert: vi.fn().mockReturnThis(),
      };
      return await cb(tx);
    });

    await expect(
      FinanceService.verifyPaymentOrder(mockOrderId, 'VERIFIED', mockTenantId, mockUserId)
    ).rejects.toThrow('对账单状态已过期');
  });
});
