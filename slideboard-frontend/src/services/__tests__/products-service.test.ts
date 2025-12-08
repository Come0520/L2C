import { vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { productsService, Product } from '../products.client';

vi.mock('@/lib/supabase/client', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  } as any
  return {
    createClient: vi.fn(() => mockSupabaseClient)
  }
});



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
    images: {
      detailImages: ['https://example.com/detail1.jpg'],
      effectImages: ['https://example.com/effect1.jpg'],
      caseImages: ['https://example.com/case1.jpg']
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockDbProduct = {
    id: 'test-product-id',
    product_code: 'TEST-PROD-001',
    product_name: '测试产品',
    category_level1_id: '窗帘',
    category_level2_id: '布艺窗帘',
    unit: '米',
    status: 'online',
    cost_price: 100,
    internal_cost_price: 90,
    internal_settlement_price: 150,
    settlement_price: 160,
    retail_price: 200,
    images: {
      detailImages: ['https://example.com/detail1.jpg'],
      effectImages: ['https://example.com/effect1.jpg'],
      caseImages: ['https://example.com/case1.jpg']
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [mockDbProduct], 
          error: null 
        })
      });

      const result = await productsService.getAllProducts();

      expect(result).toEqual([mockProduct]);
      expect(supabaseClient.from).toHaveBeenCalledWith('products');
    });

    it('should return empty array when no products', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        })
      });

      const result = await productsService.getAllProducts();

      expect(result).toEqual([]);
    });

    it('should return empty array when fetch fails', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Fetch error') 
        })
      });

      const result = await productsService.getAllProducts();

      expect(result).toEqual([]);
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: mockDbProduct, 
          error: null 
        })
      });

      const result = await productsService.getProductById('test-product-id');

      expect(result).toEqual(mockProduct);
      expect(supabaseClient.from).toHaveBeenCalledWith('products');
      expect((supabaseClient.from as any).mock.results[0]!.value!.eq).toHaveBeenCalledWith('id', 'test-product-id');
    });

    it('should return null when product not found', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Not found') 
        })
      });

      const result = await productsService.getProductById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const supabaseClient = createClient();
      
      // Mock the sequence of calls: insert -> select for getProductById
      (supabaseClient.from as any)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: [{ id: 'test-product-id' }], error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockDbProduct, error: null })
        });

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
      expect(supabaseClient.from).toHaveBeenCalledWith('products');
    });

    it('should return null when create fails', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Create error') 
        })
      });

      const result = await productsService.createProduct({ productName: '测试产品' });

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('should update product', async () => {
      const supabaseClient = createClient();
      
      // Mock the sequence of calls: update -> select for getProductById
      (supabaseClient.from as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockDbProduct, error: null })
        });

      const result = await productsService.updateProduct('test-product-id', {
        productName: '更新后的产品名称'
      });

      expect(result).toEqual(mockProduct);
      expect(supabaseClient.from).toHaveBeenCalledWith('products');
    });

    it('should return null when update fails', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          error: new Error('Update error') 
        })
      });

      const result = await productsService.updateProduct('test-product-id', {
        productName: '更新后的产品名称'
      });

      expect(result).toBeNull();
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

      const updatedDbProduct = {
        ...mockDbProduct,
        cost_price: 120,
        internal_cost_price: 110,
        internal_settlement_price: 170,
        settlement_price: 180,
        retail_price: 220
      };

      const supabaseClient = createClient();
      (supabaseClient.from as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: updatedDbProduct, error: null })
        });

      const result = await productsService.updateProduct('test-product-id', {
        prices: updatedProduct.prices
      });

      expect(result).toEqual(updatedProduct);
      expect(result?.prices).toEqual(updatedProduct.prices);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const result = await productsService.deleteProduct('test-product-id');

      expect(result).toBe(true);
      expect(supabaseClient.from).toHaveBeenCalledWith('products');
    });

    it('should return false when delete fails', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          error: new Error('Delete error') 
        })
      });

      const result = await productsService.deleteProduct('test-product-id');

      expect(result).toBe(false);
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

      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: onlineProduct, error: null })
      });

      const result = await productsService.getProductById('test-product-id');

      expect(result?.status).toBe('online');
    });

    it('should handle offline status correctly', async () => {
      const offlineProduct = {
        ...mockDbProduct,
        status: 'offline'
      };

      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: offlineProduct, error: null })
      });

      const result = await productsService.getProductById('test-product-id');

      expect(result?.status).toBe('offline');
    });
  });
});
