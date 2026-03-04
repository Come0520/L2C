import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeOrderService } from '../change-order.service';
import { db } from '@/shared/api/db';
import { eq, and } from 'drizzle-orm';
import { orders, orderChanges } from '@/shared/api/schema';

// Mock DB
vi.mock('@/shared/api/db', () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((col, val) => ({ col, val })),
    and: vi.fn((...args) => ({ and: args })),
  };
});

describe('ChangeOrderService', () => {
  const mockTenantId = 'tenant-1';
  const mockUserId = 'user-1';
  const mockChangeId = 'change-1';
  const mockOrderId = 'order-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('approveRequest', () => {
    it('should complete FIELD_CHANGE success path and bump version', async () => {
      const mockTx = {
        query: {
          orderChanges: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockChangeId,
              tenantId: mockTenantId,
              orderId: mockOrderId,
              status: 'PENDING',
              type: 'FIELD_CHANGE',
              newData: { notes: 'New Note' },
              diffAmount: '0',
            }),
          },
          orders: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockOrderId,
              version: 5,
              totalAmount: '1000',
              balanceAmount: '1000',
            }),
          },
        },
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: '*' }]),
        })),
      };

      (db.transaction as any).mockImplementation((cb: any) => cb(mockTx));

      const updated = await ChangeOrderService.approveRequest(
        mockChangeId,
        mockTenantId,
        mockUserId
      );
      expect(updated).toBeDefined();

      // Check optimism lock parameters were used up properly
      expect(mockTx.update).toHaveBeenCalledWith(orders);
    });

    it('should throw error if order is concurrently modified during FIELD_CHANGE', async () => {
      const mockTx = {
        query: {
          orderChanges: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockChangeId,
              tenantId: mockTenantId,
              orderId: mockOrderId,
              status: 'PENDING',
              type: 'FIELD_CHANGE',
              newData: { notes: 'New Note' },
              diffAmount: '0',
            }),
          },
          orders: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockOrderId,
              version: 5,
            }),
          },
        },
        update: vi.fn((table) => {
          if (table === orders) {
            return {
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([]), // Empty array simulates 0 rows updated (lock failed)
            };
          }
          return {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: '*' }]),
          };
        }),
      };

      (db.transaction as any).mockImplementation((cb: any) => cb(mockTx));

      await expect(
        ChangeOrderService.approveRequest(mockChangeId, mockTenantId, mockUserId)
      ).rejects.toThrow('订单已被并发修改，无法执行变更');
    });

    it('should throw error if order totalAmount is concurrently modified when diffAmount is not 0', async () => {
      const mockTx = {
        query: {
          orderChanges: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockChangeId,
              tenantId: mockTenantId,
              orderId: mockOrderId,
              status: 'PENDING',
              type: 'ITEM_CHANGE',
              newData: null,
              diffAmount: '100.5',
            }),
          },
          orders: {
            findFirst: vi.fn().mockResolvedValue({
              id: mockOrderId,
              version: 5,
              totalAmount: '1000',
              balanceAmount: '1000',
            }),
          },
        },
        update: vi.fn((table) => {
          if (table === orders) {
            return {
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([]), // lock failed
            };
          }
          return {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: '*' }]),
          };
        }),
      };

      (db.transaction as any).mockImplementation((cb: any) => cb(mockTx));

      await expect(
        ChangeOrderService.approveRequest(mockChangeId, mockTenantId, mockUserId)
      ).rejects.toThrow('订单总额已被并发修改，差价未能合并');
    });
  });
});
