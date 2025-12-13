import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllProducts, getProductById, getProductCategories } from '../products.server';

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    })
  };
});

describe('products.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should retrieve all products successfully', async () => {
      // Act
      const result = await getAllProducts();
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle filter with search term correctly', async () => {
      // Act
      const result = await getAllProducts({ searchTerm: 'test' });
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle filter with status correctly', async () => {
      // Act
      const result = await getAllProducts({ status: 'active' });
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('should retrieve a single product by id successfully', async () => {
      // Act
      const result = await getProductById('product-123');
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should return null for non-existent product id', async () => {
      // Act
      const result = await getProductById('non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getProductCategories', () => {
    it('should retrieve product categories successfully', async () => {
      // Act
      const result = await getProductCategories();
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach(category => {
        expect(category).toHaveProperty('value');
        expect(category).toHaveProperty('label');
      });
    });

    it('should include "all" category as first item', async () => {
      // Act
      const result = await getProductCategories();
      
      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual({ value: 'all', label: '全部分类' });
    });
  });
});
