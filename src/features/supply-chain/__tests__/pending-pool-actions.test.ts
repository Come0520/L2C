import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import {
  getPendingPurchaseItems,
  assignToSupplier,
  submitForApproval,
  mergeToPurchaseOrder,
} from '../actions/pending-pool-actions';
import { PO_STATUS } from '../constants';

// ---- Mock Modules ----
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
  checkPermission: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/shared/lib/audit-service', () => ({
  AuditService: {
    recordFromSession: vi.fn(),
  },
}));

const { mockTx, mockDb } = vi.hoisted(() => {
  const tx = {
    insert: vi
      .fn()
      .mockReturnValue({
        values: vi
          .fn()
          .mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]) }),
      }),
    update: vi
      .fn()
      .mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(true) }),
      }),
    select: vi
      .fn()
      .mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
    query: {
      suppliers: { findFirst: vi.fn().mockResolvedValue({ name: 'Supplier' }) },
    },
  };

  // Create chainable mock builder for select operations
  const createDbSelectChain = (retValue: any = []) => {
    const offsetMock = vi.fn().mockResolvedValue(retValue);
    const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const leftJoinMock = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ orderBy: orderByMock }),
    });
    const whereMock = vi.fn().mockReturnValue({
      orderBy: orderByMock,
      limit: limitMock,
      leftJoin: leftJoinMock,
    });
    const fromMock = vi.fn().mockReturnValue({
      where: whereMock,
      leftJoin: leftJoinMock,
      orderBy: orderByMock,
    });
    return vi.fn().mockReturnValue({ from: fromMock });
  };

  return {
    mockTx: tx,
    mockDb: {
      select: createDbSelectChain([]),
      query: {
        suppliers: { findFirst: vi.fn() },
      },
      update: vi
        .fn()
        .mockReturnValue({
          set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(true) }),
        }),
      transaction: vi.fn(async (cb: any) => cb(tx)),
    },
  };
});

vi.mock('@/shared/api/db', () => ({
  db: mockDb,
}));

describe('Pending Pool Actions', () => {
  const mockSession = { user: { id: 'u1', tenantId: 't1', role: 'ADMIN' } };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSession);
    (checkPermission as any).mockResolvedValue(true);
  });

  describe('getPendingPurchaseItems', () => {
    it('should require authentication', async () => {
      (auth as any).mockResolvedValue(null);
      await expect(
        getPendingPurchaseItems({ page: 1, pageSize: 20, itemType: 'ALL' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should fetch PO, tasks and unmatched items', async () => {
      const result = await getPendingPurchaseItems({ page: 1, pageSize: 20, itemType: 'ALL' });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.draftPOs).toBeDefined();
      expect(result.pendingTasks).toBeDefined();
      expect(result.unmatchedItems).toBeDefined();
    });
  });

  describe('assignToSupplier', () => {
    it('should fail if supplier does not exist', async () => {
      mockDb.query.suppliers.findFirst.mockResolvedValueOnce(undefined);
      await expect(
        assignToSupplier({
          orderItemIds: ['123e4567-e89b-12d3-a456-426614174001'],
          supplierId: '123e4567-e89b-12d3-a456-426614174002',
          poType: 'FINISHED',
        })
      ).rejects.toThrow('供应商不存在或无权操作');
    });
  });

  describe('submitForApproval', () => {
    it('should submit DRAFT pos for approval via transaction', async () => {
      // Mock transaction select to return DRAFT items
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: '123e4567-e89b-12d3-a456-426614174003', status: PO_STATUS.DRAFT },
            { id: '123e4567-e89b-12d3-a456-426614174004', status: PO_STATUS.DRAFT },
          ]),
        }),
      });

      const result = await submitForApproval({
        poIds: ['123e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174004'],
      });

      expect(result.success).toBe(true);
      expect(result.submittedCount).toBe(2);
      expect(mockTx.update).toHaveBeenCalled();
    });

    it('should throw if no DRAFT pos exist', async () => {
      // Mock transaction select to return only non-draft
      mockTx.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([
              { id: '123e4567-e89b-12d3-a456-426614174005', status: PO_STATUS.SHIPPED },
            ]),
        }),
      });

      await expect(
        submitForApproval({ poIds: ['123e4567-e89b-12d3-a456-426614174005'] })
      ).rejects.toThrow('没有可提交的采购单');
    });
  });
});
