import { ApiError } from '@/lib/api/error-handler';

import { salesOrderService } from '../salesOrders.client';

// Mock the supabase client
// Create a mock query object that returns itself for all methods
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

const client = {
  rpc: vi.fn(),
  from: vi.fn(() => mockSupabaseQuery),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => client),
}));

describe('salesOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置mockSupabaseQuery的所有方法
    Object.values(mockSupabaseQuery).forEach((fn: any) => {
      if (typeof fn === 'function') {
        // 只重置mock函数，不是mockReturnThis()调用返回的对象
        if (fn.mockReset) {
          fn.mockReset();
          fn.mockReturnThis();
        }
      }
    });
  });

  describe('createSalesOrder', () => {
    it('should create sales order successfully', async () => {
      const orderData = {
        customerName: 'Test Customer',
        customerPhone: '13800138000',
        projectAddress: 'Test Address',
        items: [],
      };

      (client.rpc as any).mockResolvedValue({
        data: 'test-order-id',
        error: null,
      });

      const result = await salesOrderService.createSalesOrder(orderData as any);

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: { id: 'test-order-id' }
      });
      expect(client.rpc).toHaveBeenCalledWith('create_order', { order_data: orderData as any });
    });

    it('should handle error when creating sales order', async () => {
      const orderData = {
        customerName: 'Test Customer',
        customerPhone: '13800138000',
        projectAddress: 'Test Address',
        items: [],
      };

      (client.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Create order failed' },
      });

      await expect(salesOrderService.createSalesOrder(orderData as any))
        .rejects.toThrow(ApiError);
    });
  });

  describe('getSalesOrders', () => {
    it('should get sales orders list successfully', async () => {
      const mockDbOrders = [
        {
          id: 'order-1',
          sales_no: 'SO001',
          status: 'pending',
          customer_name: 'Test Customer',
        },
      ];
      const expectedOrders = [
        {
          id: 'order-1',
          salesNo: 'SO001',
          status: 'pending',
          customerName: 'Test Customer',
        },
      ];

      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockReturnThis();
      (client.from().select().eq().ilike as any).mockReturnThis();
      (client.from().select().eq().ilike().range as any).mockReturnThis();
      (client.from().select().eq().ilike().range().order as any).mockResolvedValue({
        data: mockDbOrders,
        count: 1,
        error: null,
      });

      const result = await salesOrderService.getSalesOrders(1, 10, 'pending', 'Test');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: { orders: expectedOrders, total: 1, page: 1, pageSize: 10 }
      });
    });

    it('should handle error when getting sales orders', async () => {
      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().range as any).mockReturnThis();
      (client.from().select().range().order as any).mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Get orders failed' },
      });

      await expect(salesOrderService.getSalesOrders())
        .rejects.toThrow(ApiError);
    });
  });

  describe('getSalesOrderById', () => {
    it('should get sales order by id successfully', async () => {
      const mockDbOrder = {
        id: 'order-1',
        sales_no: 'SO001',
        status: 'pending',
        customer_name: 'Test Customer',
      };
      const expectedOrder = {
        id: 'order-1',
        salesNo: 'SO001',
        status: 'pending',
        customerName: 'Test Customer',
      };

      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockReturnThis();
      const singleMock1 = client.from().select().eq().single as any;
      singleMock1.mockResolvedValue({
        data: mockDbOrder,
        error: null,
      });

      const result = await salesOrderService.getSalesOrderById('order-1');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: expectedOrder
      });
    });

    it('should handle error when getting sales order by id', async () => {
      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockReturnThis();
      const singleMock2 = client.from().select().eq().single as any;
      singleMock2.mockResolvedValue({
        data: null,
        error: { message: 'Get order failed' },
      });

      await expect(salesOrderService.getSalesOrderById('order-1'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('updateSalesOrder', () => {
    it('should update sales order status successfully', async () => {
      (client.rpc as any).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await salesOrderService.updateSalesOrder('order-1', { status: 'processing' });

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: { id: 'order-1' }
      });
      expect(client.rpc).toHaveBeenCalledWith('update_order_status', {
        p_order_id: 'order-1',
        p_new_status: 'processing',
        p_changed_by_id: null,
      });
    });

    it('should update sales order information successfully', async () => {
      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().update as any).mockReturnThis();
      (client.from().update().eq as any).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await salesOrderService.updateSalesOrder('order-1', {
        customerName: 'Updated Customer',
        customerPhone: '13900139000',
      });

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: { id: 'order-1' }
      });
    });

    it('should handle error when updating sales order', async () => {
      (client.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Update order failed' },
      });

      await expect(salesOrderService.updateSalesOrder('order-1', { status: 'processing' }))
        .rejects.toThrow(ApiError);
    });
  });

  describe('deleteSalesOrder', () => {
    it('should delete sales order successfully', async () => {
      (client.rpc as any).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await salesOrderService.deleteSalesOrder('order-1');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: null
      });
      expect(client.rpc).toHaveBeenCalledWith('delete_order', { p_order_id: 'order-1' });
    });

    it('should handle error when deleting sales order', async () => {
      (client.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Delete order failed' },
      });

      await expect(salesOrderService.deleteSalesOrder('order-1'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('getSalesOrderItems', () => {
    it('should get sales order items successfully', async () => {
      const mockDbItems = [
        {
          id: 'item-1',
          order_id: 'order-1',
          product_id: 'product-1',
          quantity: 1,
          unit_price: 100,
        },
      ];
      const expectedItems = [
        {
          id: 'item-1',
          orderId: 'order-1',
          productId: 'product-1',
          quantity: 1,
          unitPrice: 100,
        },
      ];

      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockResolvedValue({
        data: mockDbItems,
        error: null,
      });

      const result = await salesOrderService.getSalesOrderItems('order-1');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: expectedItems
      });
    });

    it('should handle error when getting sales order items', async () => {
      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockResolvedValue({
        data: null,
        error: { message: 'Get order items failed' },
      });

      await expect(salesOrderService.getSalesOrderItems('order-1'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('getSalesOrderPackages', () => {
    it('should get sales order packages successfully', async () => {
      const mockDbPackages = [
        {
          id: 'package-1',
          sales_order_id: 'order-1',
          package_name: 'Test Package',
        },
      ];
      const expectedPackages = [
        {
          id: 'package-1',
          salesOrderId: 'order-1',
          packageName: 'Test Package',
        },
      ];

      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockResolvedValue({
        data: mockDbPackages,
        error: null,
      });

      const result = await salesOrderService.getSalesOrderPackages('order-1');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: expectedPackages
      });
    });

    it('should handle error when getting sales order packages', async () => {
      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockResolvedValue({
        data: null,
        error: { message: 'Get order packages failed' },
      });

      await expect(salesOrderService.getSalesOrderPackages('order-1'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('getSalesOrderDetails', () => {
    it('should get sales order details successfully', async () => {
      const mockDbOrder = {
        id: 'order-1',
        sales_no: 'SO001',
        status: 'pending',
        customer_name: 'Test Customer',
        items: [],
      };
      const expectedOrder = {
        id: 'order-1',
        salesNo: 'SO001',
        status: 'pending',
        customerName: 'Test Customer',
        items: [],
      };

      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockReturnThis();
      const singleMock3 = client.from().select().eq().single as any;
      singleMock3.mockResolvedValue({
        data: mockDbOrder,
        error: null,
      });

      const result = await salesOrderService.getSalesOrderDetails('order-1');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: expectedOrder
      });
    });

    it('should handle error when getting sales order details', async () => {
      (client.from as any).mockReturnValue(mockSupabaseQuery);
      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockReturnThis();
      const singleMock4 = client.from().select().eq().single as any;
      singleMock4.mockResolvedValue({
        data: null,
        error: { message: 'Get order details failed' },
      });

      await expect(salesOrderService.getSalesOrderDetails('order-1'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('getSalesOrderStatusHistory', () => {
    it('should get sales order status history successfully', async () => {
      const mockHistory = [
        {
          status: 'pending',
          changed_at: new Date().toISOString(),
          changed_by: 'test-user',
        },
      ];

      (client.rpc as any).mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      const result = await salesOrderService.getSalesOrderStatusHistory('order-1');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: mockHistory
      });
      expect(client.rpc).toHaveBeenCalledWith('get_order_status_history', { p_order_id: 'order-1' });
    });

    it('should handle error when getting sales order status history', async () => {
      (client.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Get status history failed' },
      });

      await expect(salesOrderService.getSalesOrderStatusHistory('order-1'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('batchUpdateSalesOrderStatus', () => {
    it('should batch update sales order status successfully', async () => {
      (client.rpc as any).mockResolvedValue({
        data: 2,
        error: null,
      });

      const result = await salesOrderService.batchUpdateSalesOrderStatus(['order-1', 'order-2'], 'processing');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: { updatedCount: 2 }
      });
      expect(client.rpc).toHaveBeenCalledWith('batch_update_order_status', {
        p_order_ids: ['order-1', 'order-2'] as any,
        p_new_status: 'processing',
      });
    });

    it('should handle error when batch updating sales order status', async () => {
      (client.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Batch update failed' },
      });

      await expect(salesOrderService.batchUpdateSalesOrderStatus(['order-1'], 'processing'))
        .rejects.toThrow(ApiError);
    });
  });
});
