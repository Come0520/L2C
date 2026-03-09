import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '@/services/order.service';
import { db } from '@/shared/api/db';
import { submitApproval } from '@/features/approval/actions/submission';
import { AuditService } from '@/shared/services/audit-service';
import { CustomerStatusService } from '@/services/customer-status.service';
import { orders, orderChanges } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';

// Mock Dependencies
vi.mock('@/shared/api/db', () => {
  const mockReturnSelf = vi.fn().mockReturnThis();
  return {
    db: {
      query: {
        orders: { findFirst: vi.fn() },
      },
      transaction: vi.fn((cb) => {
        const tx = {
          query: {
            orders: { findFirst: vi.fn() },
          },
          insert: vi.fn(() => ({
            values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'order-123' }]) })),
          })),
          update: vi.fn(() => ({
            set: mockReturnSelf,
            where: mockReturnSelf,
            returning: vi.fn().mockResolvedValue([{ id: 'updated' }]),
            then: function (resolve: any) {
              resolve([{ id: 'updated' }]);
            },
          })),
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({ limit: vi.fn(() => ({ delay: vi.fn() })) })),
            })),
          })),
        };
        return cb(tx);
      }),
    },
  };
});

vi.mock('@/features/approval/actions/submission', () => ({
  submitApproval: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    record: vi.fn(),
  },
}));

vi.mock('@/services/customer-status.service', () => ({
  CustomerStatusService: {
    onOrderCompleted: vi.fn(),
    onOrderCancelled: vi.fn(),
  },
}));

vi.mock('@/shared/utils/serial-generator', () => ({
  generateSerialNumber: vi.fn().mockResolvedValue('ORD-2024'),
}));

describe('OrderService', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('haltOrder', () => {
    it('should halt order successfully', async () => {
      const mockOrder = {
        id: mockOrderId,
        tenantId: mockTenantId,
        status: 'IN_PRODUCTION',
        metadata: {},
      };

      // Mock findFirst inside transaction
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: { orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) } },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ ...mockOrder, status: 'HALTED' }]),
          })),
        };
        return cb(tx);
      });

      const result = await OrderService.haltOrder(
        mockOrderId,
        mockTenantId,
        mockUserId,
        'Material Shortage'
      );
      expect(result.status).toBe('HALTED');
      expect(AuditService.record).toHaveBeenCalled();
    });

    it('should throw error if order not found or tenant check fails', async () => {
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: { orders: { findFirst: vi.fn().mockResolvedValue(null) } },
        };
        return cb(tx);
      });

      await expect(
        OrderService.haltOrder(mockOrderId, mockTenantId, mockUserId, 'Reason')
      ).rejects.toThrow('订单不存在');
    });

    it('should throw error if status does not allow halt', async () => {
      const mockOrder = {
        id: mockOrderId,
        tenantId: mockTenantId,
        status: 'DRAFT', // DRAFT cannot be halted
        metadata: {},
      };

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: { orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) } },
        };
        return cb(tx);
      });

      await expect(
        OrderService.haltOrder(mockOrderId, mockTenantId, mockUserId, 'Reason')
      ).rejects.toThrow('允许的状态');
    });
  });

  describe('requestCancellation', () => {
    it('should submit approval for cancellation', async () => {
      const mockOrder = {
        id: mockOrderId,
        tenantId: mockTenantId,
        status: 'PENDING_PRODUCTION',
        metadata: {},
      };

      // Mock implementation
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: { orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) } },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ ...mockOrder, isLocked: true }]),
          })),
        };
        // Mock submitApproval specific return
        (submitApproval as any).mockResolvedValue({ success: true, approvalId: 'approval-1' });
        return cb(tx);
      });

      const result = await OrderService.requestCancellation(
        mockOrderId,
        mockTenantId,
        mockUserId,
        'Customer Request'
      );

      expect(submitApproval).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw if status is not cancelable', async () => {
      const mockOrder = {
        id: mockOrderId,
        tenantId: mockTenantId,
        status: 'COMPLETED',
        metadata: {},
      };

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: { orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) } },
        };
        return cb(tx);
      });

      await expect(
        OrderService.requestCancellation(mockOrderId, mockTenantId, mockUserId, 'Reason')
      ).rejects.toThrow('只有待生产或生产中的订单可以申请撤单');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update status successfully', async () => {
      const mockOrder = {
        id: mockOrderId,
        tenantId: mockTenantId,
        status: 'PENDING_MEASURE',
      };

      // transaction mock
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: { orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) } },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ ...mockOrder, status: 'MEASURED' }]),
          })),
        };
        return cb(tx);
      });

      const result = await OrderService.updateOrderStatus(
        mockOrderId,
        'MEASURED',
        mockTenantId,
        1,
        mockUserId
      );
      expect(result.status).toBe('MEASURED');
    });

    it('should trigger onOrderCompleted when status becomes COMPLETED via customerAccept', async () => {
      const mockOrder = {
        id: mockOrderId,
        tenantId: mockTenantId,
        customerId: 'cust-123',
        status: 'PENDING_CONFIRMATION',
        version: 1,
      };

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: { orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) } },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ ...mockOrder, status: 'COMPLETED' }]),
          })),
        };
        return cb(tx);
      });

      await OrderService.customerAccept(
        mockOrderId,
        mockTenantId,
        1
      );

      expect(CustomerStatusService.onOrderCompleted).toHaveBeenCalledWith('cust-123', mockTenantId);
    });

    it('should trigger onOrderCancelled when status becomes CANCELLED', async () => {
      const mockOrder = {
        id: mockOrderId,
        tenantId: mockTenantId,
        customerId: 'cust-123',
        status: 'PENDING_INSTALL',
        version: 1,
      };

      const mockTx = {
        query: { orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) } },
        update: vi.fn(() => ({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ ...mockOrder, status: 'CANCELLED' }]),
        })),
      };

      (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

      await OrderService.executeCancelOrder(
        mockOrderId,
        'change-record-1',
        mockTenantId,
        mockUserId
      );

      expect(CustomerStatusService.onOrderCancelled).toHaveBeenCalledWith('cust-123', mockTenantId);
    });

    it('should validate transition logic', async () => {
      const mockOrder = {
        id: mockOrderId,
        tenantId: mockTenantId,
        status: 'DRAFT',
      };

      // transaction mock
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: { orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) } },
        };
        return cb(tx);
      });

      await expect(
        OrderService.updateOrderStatus(mockOrderId, 'COMPLETED', mockTenantId, 1, mockUserId)
      ).rejects.toThrow(); // Transition from DRAFT to COMPLETED is invalid
    });
  });

  describe('executeCancelOrder', () => {
    const orderId = 'order-1';
    const changeRecordId = 'change-1';
    const tenantId = 'tenant-1';
    const approverId = 'approver-1';

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should successfully cancel order and update change record', async () => {
      // Mock db.transaction to yield our custom tx
      const mockOrder = { id: orderId, tenantId, status: 'CANCELLED_REQUESTED', version: 1, customerId: 'cust-123' };

      const mockTx = {
        query: {
          orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) },
        },
        update: vi.fn().mockImplementation((table) => {
          return {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'updated' }]),
          };
        }),
      };

      (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

      const result = await OrderService.executeCancelOrder(
        orderId,
        changeRecordId,
        tenantId,
        approverId
      );

      expect(result).toBe(true);

      // Expected findFirst call
      expect(mockTx.query.orders.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
        })
      );

      // Expected update calls
      expect(mockTx.update).toHaveBeenCalledWith(orders);
      expect(mockTx.update).toHaveBeenCalledWith(orderChanges);

      // Expected Audit log
      expect(AuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          changedFields: { status: 'CANCELLED' },
        }),
        mockTx
      );

      // Expected Customer Status update
      expect(CustomerStatusService.onOrderCancelled).toHaveBeenCalledWith(mockOrder.customerId, tenantId);
    });

    it('should throw if order does not exist or tenant check fails', async () => {
      const mockTx = {
        query: {
          orders: { findFirst: vi.fn().mockResolvedValue(null) },
        },
      };
      (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

      await expect(
        OrderService.executeCancelOrder(orderId, changeRecordId, tenantId, approverId)
      ).rejects.toThrow('订单不存在或无权访问');
    });

    it('should throw if optimistic lock check fails', async () => {
      const mockOrder = { id: orderId, tenantId, status: 'CANCELLED_REQUESTED', version: 1 };

      const mockTx = {
        query: {
          orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) },
        },
        update: vi.fn().mockImplementation((table) => {
          return {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([]), // Returns empty => concurrent mod
          };
        }),
      };
      (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

      await expect(
        OrderService.executeCancelOrder(orderId, changeRecordId, tenantId, approverId)
      ).rejects.toThrow('订单已被并发修改，无法执行撤单');
    });
  });

  describe('convertFromQuote', () => {
    it('should correctly map costPrice from quote items to order items', async () => {
      const mockQuoteId = 'quote-123';
      const mockQuote = {
        id: mockQuoteId,
        tenantId: mockTenantId,
        status: 'APPROVED',
        totalAmount: '1000.00',
        customerId: 'cust-1',
        customer: { name: 'Test Customer', phone: '123456789' },
        createdBy: mockUserId,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Test Product',
            category: 'CURTAIN',
            quantity: '2',
            unitPrice: '100.00',
            costPrice: '50.00', // Ensure this maps correctly
            subtotal: '200.00',
          },
        ],
      };

      const mockInsertValues = vi
        .fn()
        .mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'new-order-id' }]) });
      const mockInsertItemValues = vi.fn();

      // transaction mock for convertFromQuote
      (db.transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          query: {
            receiptBills: { findMany: vi.fn().mockResolvedValue([]) },
          },
          insert: vi.fn((table) => {
            // Rough check to distinguish orders vs orderItems insert
            // In reality drizzle table objects are passed, we just mock the chain
            return {
              values: (data: any) => {
                if (Array.isArray(data) && data[0] && 'costPrice' in data[0]) {
                  mockInsertItemValues(data);
                }
                return { returning: vi.fn().mockResolvedValue([{ id: 'new-order-id' }]) };
              },
            };
          }),
          update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
          })),
        };
        return cb(tx);
      });

      // Mock DB query out side of tx
      db.query.quotes = { findFirst: vi.fn().mockResolvedValue(mockQuote as any) } as any;
      // Re-mock transaction just for this scoped test to ensure db.transaction is correct
      vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
        const tx = {
          query: {
            quotes: { findFirst: vi.fn().mockResolvedValue(mockQuote) },
            orders: { findFirst: vi.fn().mockResolvedValue(null) },
            receiptBills: { findMany: vi.fn().mockResolvedValue([]) },
            tenants: { findFirst: vi.fn().mockResolvedValue({ settings: {} }) },
          },
          insert: vi.fn((table: any) => ({
            values: (data: any) => {
              if (Array.isArray(data) && data[0] && 'costPrice' in data[0]) {
                mockInsertItemValues(data);
              }
              return {
                returning: vi
                  .fn()
                  .mockResolvedValue([{ id: 'new-order-id', customerId: 'cust-1' }]),
              };
            },
          })),
          update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
          })),
        };
        return cb(tx);
      });

      await OrderService.convertFromQuote(mockQuoteId, mockTenantId, mockUserId, {
        paymentAmount: '0',
      });

      expect(mockInsertItemValues).toHaveBeenCalled();
      const calledData = mockInsertItemValues.mock.calls[0][0];
      expect(calledData[0]).toMatchObject({
        costPrice: '50.00',
      });
    });
  });
});
