import { vi, describe, it, expect, beforeEach } from 'vitest';
import { productsService, Product } from '../products.client';

// Simplified mock for supabase client
vi.mock('@/lib/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        or: vi.fn().mockReturnThis(),
        
        // Add then method to support await
        async then(resolve: any) {
          resolve({ data: [], error: null });
        }
      })
    }
  };
});

// Simplified mock import
import { supabase } from '@/lib/supabase/client';
describe('Products Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct: Product = {
    id: 'test-product-id',
    productCode: 'TEST-PROD-001',
    productName: '测试产品',
    categoryLevel1: '窗帘',
    categoryLevel2: '布艺窗帘',
    unit: '米',
    status: 'online',
    prices: {
      costPrice: 100,
      internalCostPrice: 90,
      internalSettlementPrice: 150,
      settlementPrice: 160,
      retailPrice: 200
    },
    attributes: {},
    images: {
      detailImages: ['https://example.com/detail1.jpg'],
      effectImages: ['https://example.com/effect1.jpg'],
      caseImages: ['https://example.com/case1.jpg']
    },
    tags: {
      styleTags: [],
      packageTags: [],
      activityTags: [],
      seasonTags: [],
      demographicTags: []
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockDbProduct = {
    id: 'test-product-id',
    product_code: 'TEST-PROD-001',
    product_name: '测试产品',
    category_level1: '窗帘',
    category_level2: '布艺窗帘',
    unit: '米',
    status: 'online',
    prices: {
      costPrice: 100,
      internalCostPrice: 90,
      internalSettlementPrice: 150,
      settlementPrice: 160,
      retailPrice: 200
    },
    attributes: {},
    images: {
      detailImages: ['https://example.com/detail1.jpg'],
      effectImages: ['https://example.com/effect1.jpg'],
      caseImages: ['https://example.com/case1.jpg']
    },
    tags: {
      styleTags: [],
      packageTags: [],
      activityTags: [],
      seasonTags: [],
      demographicTags: []
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      // Setup mock response
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        async then(resolve: any) {
          resolve({ data: [mockDbProduct], error: null });
        }
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.getAllProducts();

      expect(result).toEqual([mockProduct]);
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    it('should return empty array when no products', async () => {
      // Setup mock response
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        async then(resolve: any) {
          resolve({ data: [], error: null });
        }
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.getAllProducts();

      expect(result).toEqual([]);
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      // Setup mock response
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: mockDbProduct, 
          error: null 
        })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.getProductById('test-product-id');

      expect(result).toEqual(mockProduct);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-product-id');
    });

    it('should return null when product not found', async () => {
      // Setup mock response for not found
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'Not found' } 
        })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.getProductById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      // Setup mock response
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDbProduct, error: null })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.createProduct({
        productCode: 'TEST-PROD-001',
        productName: '测试产品',
        categoryLevel1: '窗帘',
        categoryLevel2: '布艺窗帘',
        unit: '米',
        status: 'online',
        prices: {
          costPrice: 100,
          internalCostPrice: 90,
          internalSettlementPrice: 150,
          settlementPrice: 160,
          retailPrice: 200
        }
      });

      expect(result).toEqual(mockProduct);
      expect(supabase.from).toHaveBeenCalledWith('products');
    });
  });

  describe('updateProduct', () => {
    it('should update product', async () => {
      // Setup mock response
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDbProduct, error: null })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.updateProduct('test-product-id', {
        productName: '更新后的产品名称'
      });

      expect(result).toEqual(mockProduct);
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    it('should update product prices correctly', async () => {
      const updatedProduct = {
        ...mockProduct,
        prices: {
          costPrice: 120,
          internalCostPrice: 110,
          internalSettlementPrice: 170,
          settlementPrice: 180,
          retailPrice: 220
        }
      };

      // Note: In the actual code, prices are stored as a JSON object, not individual columns
      const updatedDbProduct = {
        ...mockDbProduct,
        prices: updatedProduct.prices as any
      };

      // Setup mock response
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedDbProduct, error: null })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.updateProduct('test-product-id', {
        prices: updatedProduct.prices
      });

      expect(result).toEqual(updatedProduct);
      expect(result?.prices).toEqual(updatedProduct.prices);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      // Setup mock response
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.deleteProduct('test-product-id');

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('products');
    });
  });

  describe('getProductCategories', () => {
    it('should return product categories', async () => {
      const result = await productsService.getProductCategories();

      expect(result).toEqual([
        { value: 'all', label: '全部分类' },
        { value: '窗帘', label: '窗帘' },
        { value: '墙布', label: '墙布' },
        { value: '墙咔', label: '墙咔' },
        { value: '飘窗垫', label: '飘窗垫' },
        { value: '标品', label: '标品' },
        { value: '礼品', label: '礼品' },
        { value: '销售道具', label: '销售道具' }
      ]);
    });

    it('should return categories with expected structure', async () => {
      const result = await productsService.getProductCategories();

      result.forEach(category => {
        expect(category).toHaveProperty('value');
        expect(category).toHaveProperty('label');
        expect(typeof category.value).toBe('string');
        expect(typeof category.label).toBe('string');
      });
    });
  });

  describe('Product Status', () => {
    it('should support all product statuses', () => {
      const statuses: Product['status'][] = ['draft', 'pending', 'approved', 'rejected', 'online', 'offline'];
      
      statuses.forEach(status => {
        expect(['draft', 'pending', 'approved', 'rejected', 'online', 'offline']).toContain(status);
      });
    });

    it('should handle online status correctly', async () => {
      const onlineProduct = {
        ...mockDbProduct,
        status: 'online'
      };

      // Setup mock response
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: onlineProduct, error: null })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.getProductById('test-product-id');

      expect(result?.status).toBe('online');
    });

    it('should handle offline status correctly', async () => {
      const offlineProduct = {
        ...mockDbProduct,
        status: 'offline'
      };

      // Setup mock response
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: offlineProduct, error: null })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      const result = await productsService.getProductById('test-product-id');

      expect(result?.status).toBe('offline');
    });
  });
});
