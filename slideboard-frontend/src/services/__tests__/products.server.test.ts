import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getAllProducts, getProductById, getProductCategories } from '../products.server';

const mockProductRow = {
  id: 'product-123',
  product_code: 'CODE123',
  product_name: 'Test Product',
  category_level1: 'Category 1',
  category_level2: 'Category 2',
  unit: 'PCS',
  status: 'online',
  prices: {},
  attributes: {},
  images: {},
  tags: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const { mockQuery, mockSingle } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
    then: vi.fn((resolve) => resolve({ data: [], error: null }))
  };
  return { mockQuery, mockSingle };
});

vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue(mockQuery)
    })
  };
});

describe('products.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: mockProductRow,
      error: null
    });
    // Reset then behavior for getAllProducts (which awaits the query chain)
    mockQuery.then.mockImplementation((resolve) => resolve({ data: [mockProductRow], error: null }));
  });

  describe('getAllProducts', () => {
    it('should retrieve all products successfully', async () => {
      const result = await getAllProducts();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(mockProductRow.id);
    });

    it('should handle filter with search term correctly', async () => {
      const result = await getAllProducts({ searchTerm: 'test' });
      expect(result).toBeDefined();
      expect(mockQuery.or).toHaveBeenCalledWith('product_name.ilike.%test%,product_code.ilike.%test%');
    });

    it('should handle filter with status correctly', async () => {
      const result = await getAllProducts({ status: 'online' });
      expect(result).toBeDefined();
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'online');
    });

    it('should handle filter with categoryLevel1 correctly', async () => {
      const result = await getAllProducts({ categoryLevel1: 'Category 1' });
      expect(result).toBeDefined();
      expect(mockQuery.eq).toHaveBeenCalledWith('category_level1', 'Category 1');
    });

    it('should handle filter with categoryLevel2 correctly', async () => {
      const result = await getAllProducts({ categoryLevel2: 'Category 2' });
      expect(result).toBeDefined();
      expect(mockQuery.eq).toHaveBeenCalledWith('category_level2', 'Category 2');
    });
  });

  describe('getProductById', () => {
    it('should retrieve a single product by id successfully', async () => {
      const result = await getProductById('product-123');
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockProductRow.id);
    });

    it('should return null for non-existent product id', async () => {
      // Mock not found error
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });
      
      const result = await getProductById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getProductCategories', () => {
    it('should retrieve product categories successfully', async () => {
      const result = await getProductCategories();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include "all" category as first item', async () => {
      const result = await getProductCategories();
      expect(result[0]).toEqual({ value: 'all', label: '全部分类' });
    });
  });
});
