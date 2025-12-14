import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ApiError } from '@/lib/api/error-handler';

import { salesOrderService } from '../salesOrders.client';

const { mockSupabase, mockSupabaseQuery } = vi.hoisted(() => {
  const mockSupabaseQuery: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn((resolve) => resolve({ data: [], error: null }))
  };

  const mockSupabase = {
    rpc: vi.fn(),
    from: vi.fn(() => mockSupabaseQuery),
  };
  
  return { mockSupabase, mockSupabaseQuery };
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
  supabase: mockSupabase
}));

describe('salesOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabaseQuery);
    
    // Reset defaults
    mockSupabaseQuery.select.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
    mockSupabaseQuery.ilike.mockReturnThis();
    mockSupabaseQuery.range.mockReturnThis();
    mockSupabaseQuery.order.mockReturnThis();
    mockSupabaseQuery.update.mockReturnThis();
    mockSupabaseQuery.delete.mockReturnThis();
    mockSupabaseQuery.insert.mockReturnThis();
    mockSupabaseQuery.single.mockReset();
    mockSupabaseQuery.then = vi.fn((resolve) => resolve({ data: [], error: null }));
  });

  describe('createSalesOrder', () => {
    it('should create sales order successfully', async () => {
      const orderData = {
        customerName: 'Test Customer',
        customerPhone: '13800138000',
        projectAddress: 'Test Address',
        items: [],
      };

      mockSupabase.rpc.mockResolvedValue({
        data: 'test-order-id',
        error: null,
      });

      const result = await salesOrderService.createSalesOrder(orderData as any);

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: { id: 'test-order-id' }
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_order', { order_data: orderData as any });
    });

    it('should handle error when creating sales order', async () => {
      const orderData = {
        customerName: 'Test Customer',
        customerPhone: '13800138000',
        projectAddress: 'Test Address',
        items: [],
      };

      mockSupabase.rpc.mockResolvedValue({
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
      
      mockSupabaseQuery.then.mockImplementation((resolve: any) => resolve({
        data: mockDbOrders,
        count: 1,
        error: null
      }));

      const result = await salesOrderService.getSalesOrders(1, 10);

      expect(result.data?.orders).toHaveLength(1);
      expect(result.data?.orders?.[0]?.id).toBe('order-1');
      expect(result.data?.total).toBe(1);
    });
  });

  describe('getSalesOrderById', () => {
    it('should get sales order by id successfully', async () => {
      const mockDbOrder = {
        id: 'order-1',
        sales_no: 'SO001',
        status: 'pending',
        customer_name: 'Test Customer',
        customer: { name: 'Test Customer', phone: '123' },
        items: []
      };

      mockSupabaseQuery.single.mockResolvedValue({
        data: mockDbOrder,
        error: null,
      });

      const result = await salesOrderService.getSalesOrderById('order-1');

      expect(result.data?.id).toBe('order-1');
    });

    it('should handle error when getting sales order by id', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Order not found' },
      });

      await expect(salesOrderService.getSalesOrderById('order-1'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('updateSalesOrder', () => {
    it('should update sales order status successfully', async () => {
      // 1. Get current status
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { status: 'pending', version: 1 },
        error: null
      });

      // 2. Validate status transition
      mockSupabase.rpc.mockResolvedValueOnce({
        data: true, // isValid
        error: null
      });

      // 3. Update status
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await salesOrderService.updateSalesOrder('order-1', { status: 'processing' });

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: { id: 'order-1' }
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_order_status', expect.objectContaining({
        p_order_id: 'order-1',
        p_new_status: 'processing'
      }));
    });

    it('should update sales order information successfully', async () => {
      // 1. Get current status
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { status: 'pending', version: 1 },
        error: null
      });

      // 2. Check if can modify
      mockSupabase.rpc.mockResolvedValueOnce({
        data: true, // canModify
        error: null
      });

      // 3. Update info
      mockSupabaseQuery.then.mockImplementation((resolve: any) => resolve({
        data: null,
        error: null
      }));

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
      // 1. Get current status fails
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Order not found' }
      });

      await expect(salesOrderService.updateSalesOrder('order-1', { status: 'processing' }))
        .rejects.toThrow(ApiError);
    });
  });

  describe('deleteSalesOrder', () => {
    it('should delete sales order successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await salesOrderService.deleteSalesOrder('order-1');

      expect(result).toEqual({
        code: 0,
        message: 'success',
        data: null
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('delete_order', { p_order_id: 'order-1' });
    });

    it('should handle error when deleting sales order', async () => {
      mockSupabase.rpc.mockResolvedValue({
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
      
      mockSupabaseQuery.then.mockImplementation((resolve: any) => resolve({
        data: mockDbItems,
        error: null
      }));

      const result = await salesOrderService.getSalesOrderItems('order-1');

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.id).toBe('item-1');
    });
  });
});
