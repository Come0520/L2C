import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSalesOrders, getSalesOrderById } from '../salesOrders.server';

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockImplementation(function() {
        // Use a class-like approach to store state
        const queryBuilder = {
          // Store the query ID for single() method
          queryId: null,
          
          // All chaining methods return this
          select: vi.fn().mockImplementation(function() {
            return this;
          }),
          
          order: vi.fn().mockImplementation(function() {
            return this;
          }),
          
          eq: vi.fn().mockImplementation(function(field: string, value: any) {
            if (field === 'id') {
              this.queryId = value;
            }
            return this;
          }),
          
          range: vi.fn().mockImplementation(function() {
            return this;
          }),
          
          // Single method checks for non-existent ID
          single: vi.fn().mockImplementation(async function() {
            if (this.queryId === 'non-existent-id') {
              return { 
                data: null, 
                error: { code: 'PGRST116', message: 'Not found' } 
              };
            }
            
            return { 
              data: {
                id: 'order-123',
                status: 'pending',
                total_amount: 1000,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                customer_id: 'c1',
                sales_id: 's1',
                customer: { name: 'Test Customer', phone: '1234567890' },
                sales: { name: 'Test Salesperson' },
                items: []
              },
              error: null
            };
          }),
          
          // Then method for async/await support
          then: vi.fn().mockImplementation(function(resolve: any) {
            resolve({
              data: [],
              count: 5,
              error: null
            });
          })
        };
        
        return queryBuilder;
      })
    })
  };
});

describe('salesOrders.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSalesOrders', () => {
    it('should retrieve all sales orders successfully', async () => {
      // Act
      const result = await getSalesOrders();
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.orders)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should handle pagination correctly', async () => {
      // Act
      const result = await getSalesOrders(2, 5);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('total');
    });

    it('should handle status filter correctly', async () => {
      // Act
      const result = await getSalesOrders(1, 10, 'pending');
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('total');
    });
  });

  describe('getSalesOrderById', () => {
    it('should retrieve a single sales order by id successfully', async () => {
      // Act
      const result = await getSalesOrderById('order-123');
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should return null for non-existent sales order id', async () => {
      // Act
      const result = await getSalesOrderById('non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
