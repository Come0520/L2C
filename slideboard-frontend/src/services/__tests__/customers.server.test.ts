import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getAllCustomers, getCustomerById, getCustomerStats } from '../customers.server';

const { mockQuery } = vi.hoisted(() => {
  return {
    mockQuery: {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      range: vi.fn(),
      single: vi.fn(),
      then: vi.fn()
    }
  }
})

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue(mockQuery)
    })
  };
});

describe('customers.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.select.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.or.mockReturnThis();
    mockQuery.eq.mockReturnThis();
    // Default implementation for then to avoid hanging if not mocked specifically
    mockQuery.then.mockImplementation((resolve: any) => resolve({ data: [], count: 0, error: null }));
  });

  describe('getAllCustomers', () => {
    it('should retrieve all customers successfully', async () => {
      mockQuery.range.mockResolvedValue({
        data: [{ id: '1', name: 'C1', company: 'Co1', created_at: '2024-01-01', updated_at: '2024-01-01' }],
        count: 1,
        error: null
      });
      
      const result = await getAllCustomers();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('customers');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.customers)).toBe(true);
      expect(result.customers).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });
      
      const result = await getAllCustomers(2, 5);
      
      expect(result).toBeDefined();
      expect(mockQuery.range).toHaveBeenCalledWith(5, 9);
    });

    it('should handle search term correctly', async () => {
      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });
      
      const result = await getAllCustomers(1, 10, 'test');
      
      expect(result).toBeDefined();
      expect(mockQuery.or).toHaveBeenCalled();
    });
  });

  describe('getCustomerById', () => {
    it('should retrieve a single customer by id successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: { id: 'customer-123', name: 'C1', company: 'Co1', created_at: '2024-01-01', updated_at: '2024-01-01' },
        error: null
      });
      
      const result = await getCustomerById('customer-123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('customer-123');
    });

    it('should return null for non-existent customer id', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' }
      });
      
      const result = await getCustomerById('non-existent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('getCustomerStats', () => {
    it('should retrieve customer statistics successfully', async () => {
      // 1. Total count
      mockQuery.then.mockImplementationOnce((resolve: any) => resolve({ count: 100, error: null }));
      // 2. Active count
      mockQuery.then.mockImplementationOnce((resolve: any) => resolve({ count: 50, error: null }));
      // 3. Potential count
      mockQuery.then.mockImplementationOnce((resolve: any) => resolve({ count: 20, error: null }));
      
      // 4. Total amount (uses single)
      mockQuery.single.mockResolvedValue({
        data: { total_amount: 5000 },
        error: null
      });

      const result = await getCustomerStats();
      
      expect(result).toBeDefined();
      expect(result.totalCustomers).toBe(100);
      expect(result.activeCustomers).toBe(50);
      expect(result.potentialCustomers).toBe(20);
      expect(result.totalAmount).toBe(5000);
    });
  });
});
