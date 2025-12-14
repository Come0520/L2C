import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';

import { createClient } from '@/lib/supabase/server';

import { getReconciliationOrders, completeReconciliation, submitDifferenceReconciliation, urgeOrder } from '../actions';

// Mock the supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  })
}));

describe('Order Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReconciliationOrders', () => {
    it('should fetch pending reconciliation orders', async () => {
      const supabaseClient = await createClient();
      const mockOrders = [
        {
          id: 'order-1',
          status: 'pending_reconciliation',
          created_at: '2024-01-01T00:00:00Z',
          // 其他必要字段...
        },
      ];
      
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
        single: vi.fn(),
      });
      
      const result = await getReconciliationOrders();
      
      expect(result).toEqual(mockOrders);
      expect(supabaseClient.from).toHaveBeenCalledWith('orders');
      expect(((supabaseClient.from as any).mock.results[0]!.value!.eq)).toHaveBeenCalledWith('status', 'pending_reconciliation');
    });

    it('should throw error when fetch fails', async () => {
      const supabaseClient = await createClient();
      
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch error') }),
        single: vi.fn(),
      });
      
      await expect(getReconciliationOrders()).rejects.toThrow();
    });
  });

  describe('completeReconciliation', () => {
    it('should complete reconciliation for multiple orders', async () => {
      const supabaseClient = await createClient();
      
      (supabaseClient.from as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      
      const result = await completeReconciliation(['order-1', 'order-2']);
      
      expect(result).toEqual({ success: true });
      expect(supabaseClient.from).toHaveBeenCalledWith('orders');
      expect(((supabaseClient.from as any).mock.results[0]!.value!.update)).toHaveBeenCalledWith({ status: 'pending_invoice' });
      expect(((supabaseClient.from as any).mock.results[0]!.value!.in)).toHaveBeenCalledWith('id', ['order-1', 'order-2']);
    });

    it('should throw error when update fails', async () => {
      const supabaseClient = await createClient();
      
      (supabaseClient.from as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: null, error: new Error('Update error') }),
      });
      
      await expect(completeReconciliation(['order-1'])).rejects.toThrow();
    });
  });

  describe('submitDifferenceReconciliation', () => {
    it('should submit difference reconciliation with reason', async () => {
      const supabaseClient = await createClient();
      
      (supabaseClient.from as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      
      const result = await submitDifferenceReconciliation(['order-1'], '价格差异');
      
      expect(result).toEqual({ success: true });
      expect(supabaseClient.from).toHaveBeenCalledWith('orders');
      expect(((supabaseClient.from as any).mock.results[0]!.value!.update)).toHaveBeenCalledWith({
        status: 'reconciliation_difference',
        reconciliation_notes: '价格差异'
      });
    });

    it('should throw error when update fails', async () => {
      const supabaseClient = await createClient();
      
      (supabaseClient.from as Mock).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: null, error: new Error('Update error') }),
      });
      
      await expect(submitDifferenceReconciliation(['order-1'], '差异原因')).rejects.toThrow();
    });
  });

  describe('urgeOrder', () => {
    it('should urge order successfully when measurer is assigned', async () => {
      const supabaseClient = await createClient();
      const mockOrder = {
        id: 'order-1',
        customer_name: '测试客户',
        project_address: '测试地址',
        measurement_order: [
          {
            assigned_at: new Date().toISOString(),
            measurer: [
              {
                id: 'measurer-1',
                name: '测试测量师'
              }
            ]
          }
        ]
      };
      
      (supabaseClient.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
      
      const result = await urgeOrder('order-1');
      
      expect(result).toBeDefined();
      expect((supabaseClient.from as any).mock.calls[0][0]).toBe('orders');
      expect((supabaseClient.from as any).mock.calls[1][0]).toBe('notifications');
      expect((supabaseClient.from as any).mock.calls[2][0]).toBe('measurement_orders');
    });

    it('should throw error when measurer is not assigned', async () => {
      const supabaseClient = await createClient();
      const mockOrder = {
        id: 'order-1',
        measurement_order: [
          {
            assigned_at: new Date().toISOString(),
            measurer: null
          }
        ]
      };
      
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      });
      
      await expect(urgeOrder('order-1')).rejects.toThrow('订单未分配测量师');
    });
  });
});
