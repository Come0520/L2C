import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiptService } from '../receipt.service';
import { db } from '@/shared/api/db';
import { eq, and } from 'drizzle-orm';
import {
  receiptBills,
  financeAccounts,
  accountTransactions,
  arStatements,
  orders,
} from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';

// Mock DB
vi.mock('@/shared/api/db', () => ({
  db: {
    transaction: vi.fn(async (cb) => {
      const tx = {
        query: {
          receiptBills: { findFirst: vi.fn() },
          financeAccounts: { findFirst: vi.fn() },
          arStatements: { findFirst: vi.fn() },
          orders: { findFirst: vi.fn() },
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

// Mock feature services
vi.mock('@/features/channels/logic/commission.service', () => ({
  checkAndGenerateCommission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/features/approval/actions/submission', () => ({
  submitApproval: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/shared/lib/generate-no', () => ({
  generateBusinessNo: vi.fn(() => 'TEST-NO-123'),
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue(true),
  },
}));

describe('ReceiptService (Finance TDD - Concurrency)', () => {
  const mockTenantId = 'tenant-1';
  const mockUserId = 'user-1';
  const mockBillId = 'bill-123';
  const mockAccountId = 'acc-123';
  const mockStatementId = 'stat-123';
  const mockOrderId = 'order-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[F1] should throw error when financeAccounts optimistic lock fails (returning 0 rows)', async () => {
    // Mock transaction implementation to simulate lock failure
    vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
      const tx: any = {
        query: {
          receiptBills: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockBillId,
              tenantId: mockTenantId,
              accountId: mockAccountId,
              status: 'PENDING_APPROVAL',
              totalAmount: '1000.00',
              receiptNo: 'REC-001',
              items: [],
            }),
          },
          financeAccounts: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockAccountId,
              tenantId: mockTenantId,
              balance: '500.00',
            }),
          },
        },
        update: vi.fn().mockImplementation((table) => {
          const chain = {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            // SIMULATE LOCK FAILURE WHEN UPDATING FINANCE_ACCOUNTS!
            returning: vi.fn().mockResolvedValue(table === financeAccounts ? [] : [{ id: '*' }]),
          };
          return chain;
        }),
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockReturnThis(), // allow insert returning nothing for simple cases
          returning: vi.fn().mockResolvedValue([{ id: '*' }]),
        })),
      };
      return await cb(tx);
    });

    // Current code has NO `.returning()` validation, so it currently PASSES but the test *should* assert that it THROWS!
    // We expect this to fail (i.e., not throw in reality) which confirms F1.
    await expect(ReceiptService.onApproved(mockBillId, mockTenantId, mockUserId)).rejects.toThrow(
      '账户资金状态已过期'
    );
  });

  it('[F2] should throw error when arStatements optimistic lock fails (returning 0 rows)', async () => {
    vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
      const tx: any = {
        query: {
          receiptBills: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockBillId,
              tenantId: mockTenantId,
              accountId: null, // skip account logic
              status: 'PENDING_APPROVAL',
              totalAmount: '500.00',
              receiptNo: 'REC-002',
              items: [
                {
                  statementId: mockStatementId,
                  amount: '500.00',
                  orderId: mockOrderId,
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
            }),
          },
          orders: { findFirst: vi.fn().mockResolvedValue(null) },
        },
        update: vi.fn().mockImplementation((table) => {
          return {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            // SIMULATE LOCK FAILURE WHEN UPDATING AR_STATEMENTS!
            returning: vi.fn().mockResolvedValue(table === arStatements ? [] : [{ id: '*' }]),
          };
        }),
        insert: vi.fn().mockReturnThis(),
      };
      return await cb(tx);
    });

    await expect(ReceiptService.onApproved(mockBillId, mockTenantId, mockUserId)).rejects.toThrow(
      '对账单状态已过期'
    );
  });

  it('[F3] should throw error when orders status update optimistic lock fails (version check)', async () => {
    vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
      const tx: any = {
        query: {
          receiptBills: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockBillId,
              tenantId: mockTenantId,
              accountId: null, // skip account logic
              status: 'PENDING_APPROVAL',
              totalAmount: '500.00',
              receiptNo: 'REC-003',
              items: [
                {
                  statementId: mockStatementId,
                  amount: '500.00', // Pays off the remaining
                  orderId: mockOrderId,
                },
              ],
            }),
          },
          arStatements: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockStatementId,
              tenantId: mockTenantId,
              receivedAmount: '100.00',
              totalAmount: '600.00', // Need 500
              pendingAmount: '500.00',
              status: 'PARTIAL',
            }),
          },
          orders: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockOrderId,
              tenantId: mockTenantId,
              status: 'SIGNED',
              version: 1,
            }),
          },
        },
        update: vi.fn().mockImplementation((table) => {
          return {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            // SIMULATE LOCK FAILURE WHEN UPDATING ORDERS!
            returning: vi.fn().mockResolvedValue(table === orders ? [] : [{ id: '*' }]),
          };
        }),
        insert: vi.fn().mockReturnThis(),
      };
      return await cb(tx);
    });

    await expect(ReceiptService.onApproved(mockBillId, mockTenantId, mockUserId)).rejects.toThrow(
      '订单状态已过期'
    );
  });
});
