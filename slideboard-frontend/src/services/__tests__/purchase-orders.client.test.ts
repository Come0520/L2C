import { describe, it, expect, vi, beforeEach } from 'vitest';

// 首先模拟依赖
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'po-1',
          purchase_no: 'PO-20230101-001',
          sales_order_id: 'so-1',
          supplier_id: 'supplier-1',
          total_amount: 1000,
          status: 'draft',
          expected_delivery_date: '2023-01-10',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          created_by: 'user-1',
          remarks: '测试备注',
          sales_order: { sales_no: 'SO-20230101-001' },
          supplier: { name: '测试供应商' },
          items: [
            {
              id: 'po-item-1',
              purchase_order_id: 'po-1',
              product_name: '测试产品',
              quantity: 10,
              unit_price: 100,
              total_price: 1000,
              specifications: { size: '100x100' },
              created_at: '2023-01-01T00:00:00Z'
            }
          ],
          created_by_user: { name: '测试用户' }
        },
        error: null
      }),
      then: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'po-1',
            purchase_no: 'PO-20230101-001',
            sales_order_id: 'so-1',
            supplier_id: 'supplier-1',
            total_amount: 1000,
            status: 'draft',
            expected_delivery_date: '2023-01-10',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            created_by: 'user-1',
            remarks: '测试备注',
            sales_order: { sales_no: 'SO-20230101-001' },
            supplier: { name: '测试供应商' },
            items: [
              {
                id: 'po-item-1',
                purchase_order_id: 'po-1',
                product_name: '测试产品',
                quantity: 10,
                unit_price: 100,
                total_price: 1000,
                specifications: { size: '100x100' },
                created_at: '2023-01-01T00:00:00Z'
              }
            ],
            created_by_user: { name: '测试用户' }
          }
        ],
        error: null
      })
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })
    }
  }
}));

vi.mock('@/lib/api/error-handler', () => ({
  withErrorHandler: vi.fn().mockImplementation((fn) => fn)
}));

// 然后导入服务和依赖
import { purchaseOrderService } from '../purchase-orders.client';
import { supabase } from '@/lib/supabase/client';
import { withErrorHandler } from '@/lib/api/error-handler';

describe('Purchase Orders Client Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapToPurchaseOrder', () => {
    it('should map db record to purchase order type', () => {
      // Arrange
      const mockDbRecord = {
        id: 'po-1',
        purchase_no: 'PO-20230101-001',
        sales_order_id: 'so-1',
        supplier_id: 'supplier-1',
        total_amount: 1000,
        status: 'draft',
        expected_delivery_date: '2023-01-10',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-1',
        remarks: '测试备注',
        sales_order: { sales_no: 'SO-20230101-001' },
        supplier: { name: '测试供应商' },
        items: [
          {
            id: 'po-item-1',
            purchase_order_id: 'po-1',
            product_name: '测试产品',
            quantity: 10,
            unit_price: 100,
            total_price: 1000,
            specifications: { size: '100x100' },
            created_at: '2023-01-01T00:00:00Z'
          }
        ],
        created_by_user: { name: '测试用户' }
      };

      // Act
      const result = purchaseOrderService.mapToPurchaseOrder(mockDbRecord as any);

      // Assert
      expect(result).toEqual({
        id: 'po-1',
        purchaseNo: 'PO-20230101-001',
        salesOrderId: 'so-1',
        salesOrderNo: 'SO-20230101-001',
        supplierId: 'supplier-1',
        supplierName: '测试供应商',
        totalAmount: 1000,
        status: 'draft',
        expectedDeliveryDate: '2023-01-10',
        actualDeliveryDate: undefined,
        remarks: '测试备注',
        items: [
          {
            id: 'po-item-1',
            purchaseOrderId: 'po-1',
            productName: '测试产品',
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000,
            specifications: { size: '100x100' },
            createdAt: '2023-01-01T00:00:00Z'
          }
        ],
        createdBy: 'user-1',
        createdByName: '测试用户',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      });
    });

    it('should handle null values in db record', () => {
      // Arrange
      const mockDbRecord = {
        id: 'po-1',
        purchase_no: 'PO-20230101-001',
        sales_order_id: 'so-1',
        supplier_id: null,
        total_amount: 1000,
        status: 'draft',
        expected_delivery_date: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-1',
        remarks: null,
        sales_order: null,
        supplier: null,
        items: [],
        created_by_user: null
      };

      // Act
      const result = purchaseOrderService.mapToPurchaseOrder(mockDbRecord as any);

      // Assert
      expect(result.supplierName).toBeUndefined();
      expect(result.salesOrderNo).toBeUndefined();
      expect(result.createdByName).toBeUndefined();
      expect(result.actualDeliveryDate).toBeUndefined();
      expect(result.remarks).toBeUndefined();
    });
  });

  it('should have mapToPurchaseOrder method', () => {
    expect(purchaseOrderService.mapToPurchaseOrder).toBeDefined();
    expect(typeof purchaseOrderService.mapToPurchaseOrder).toBe('function');
  });

  it('should have getPurchaseOrders method', () => {
    expect(purchaseOrderService.getPurchaseOrders).toBeDefined();
    expect(typeof purchaseOrderService.getPurchaseOrders).toBe('function');
  });

  it('should have getPurchaseOrderById method', () => {
    expect(purchaseOrderService.getPurchaseOrderById).toBeDefined();
    expect(typeof purchaseOrderService.getPurchaseOrderById).toBe('function');
  });

  it('should have createPurchaseOrder method', () => {
    expect(purchaseOrderService.createPurchaseOrder).toBeDefined();
    expect(typeof purchaseOrderService.createPurchaseOrder).toBe('function');
  });

  it('should have updateStatus method', () => {
    expect(purchaseOrderService.updateStatus).toBeDefined();
    expect(typeof purchaseOrderService.updateStatus).toBe('function');
  });

  it('should have updatePurchaseOrder method', () => {
    expect(purchaseOrderService.updatePurchaseOrder).toBeDefined();
    expect(typeof purchaseOrderService.updatePurchaseOrder).toBe('function');
  });
});
