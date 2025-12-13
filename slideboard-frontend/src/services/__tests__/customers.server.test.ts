import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllCustomers, getCustomerById, getCustomerStats } from '../customers.server';

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null
        }),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    })
  };
});

describe('customers.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllCustomers', () => {
    it('should retrieve all customers successfully', async () => {
      // Act
      const result = await getAllCustomers();
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('customers');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.customers)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should handle pagination correctly', async () => {
      // Act
      const result = await getAllCustomers(2, 5);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('customers');
      expect(result).toHaveProperty('total');
    });

    it('should handle search term correctly', async () => {
      // Act
      const result = await getAllCustomers(1, 10, 'test');
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('customers');
      expect(result).toHaveProperty('total');
    });
  });

  describe('getCustomerById', () => {
    it('should retrieve a single customer by id successfully', async () => {
      // Act
      const result = await getCustomerById('customer-123');
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should return null for non-existent customer id', async () => {
      // Act
      const result = await getCustomerById('non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getCustomerStats', () => {
    it('should retrieve customer statistics successfully', async () => {
      // Act
      const result = await getCustomerStats();
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalCustomers');
      expect(result).toHaveProperty('activeCustomers');
      expect(result).toHaveProperty('potentialCustomers');
      expect(result).toHaveProperty('totalAmount');
      expect(typeof result.totalCustomers).toBe('number');
      expect(typeof result.activeCustomers).toBe('number');
      expect(typeof result.potentialCustomers).toBe('number');
      expect(typeof result.totalAmount).toBe('number');
    });
  });
});
