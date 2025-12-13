import { describe, it, expect, beforeEach, vi } from 'vitest';
import { businessDataService } from '../businessData.client';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('BusinessDataService', () => {
  // 创建mock查询对象
  const createMockQuery = (data: any = null, error: any = null) => {
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: any) => onFulfilled({ data, error })),
      async: vi.fn().mockReturnThis()
    };
    return mockQuery;
  };

  // 创建mock supabase客户端
  const createMockSupabaseClient = (data: any = null, error: any = null) => ({
    from: vi.fn(() => createMockQuery(data, error)),
    rpc: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSalesData', () => {
    it('should return sales data when successful', async () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          sales_no: 'SO001',
          status: 'completed',
          created_at: '2025-12-12T10:00:00Z',
          customer: { name: 'Customer A' },
          amount: { total_amount: 1000 }
        },
        {
          id: '2',
          sales_no: 'SO002',
          status: 'pending',
          created_at: '2025-12-12T11:00:00Z',
          customer: { name: 'Customer B' },
          amount: { total_amount: 2000 }
        }
      ];
      
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await businessDataService.getSalesData();

      // Assert
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sales_orders');
      expect(result).toEqual([
        {
          id: '1',
          salesNo: 'SO001',
          customerName: 'Customer A',
          totalAmount: 1000,
          status: 'completed',
          createdAt: '2025-12-12T10:00:00Z'
        },
        {
          id: '2',
          salesNo: 'SO002',
          customerName: 'Customer B',
          totalAmount: 2000,
          status: 'pending',
          createdAt: '2025-12-12T11:00:00Z'
        }
      ]);
    });

    it('should apply date range filter when provided', async () => {
      // Arrange
      const mockData = [];
      const mockQuery = createMockQuery(mockData);
      mockQuery.gte = vi.fn().mockReturnThis();
      mockQuery.lte = vi.fn().mockReturnThis();
      
      const mockSupabaseClient = {
        from: vi.fn(() => mockQuery),
        rpc: vi.fn()
      };
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      const dateRange = { start: '2025-12-01', end: '2025-12-31' };

      // Act
      await businessDataService.getSalesData(dateRange);

      // Assert
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2025-12-01T00:00:00');
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2025-12-31T23:59:59');
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const mockError = new Error('Database error');
      const mockSupabaseClient = createMockSupabaseClient(null, mockError);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act & Assert
      await expect(businessDataService.getSalesData()).rejects.toThrow('Database error');
    });
  });

  describe('getLeadData', () => {
    it('should return lead data when successful', async () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          name: 'Lead A',
          status: 'qualified',
          created_at: '2025-12-12T10:00:00Z'
        },
        {
          id: '2',
          name: 'Lead B',
          status: 'new',
          created_at: '2025-12-12T11:00:00Z'
        }
      ];
      
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await businessDataService.getLeadData();

      // Assert
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('leads');
      expect(result).toEqual([
        {
          id: '1',
          name: 'Lead A',
          status: 'qualified',
          createdAt: '2025-12-12T10:00:00Z',
          qualified: true
        },
        {
          id: '2',
          name: 'Lead B',
          status: 'new',
          createdAt: '2025-12-12T11:00:00Z',
          qualified: false
        }
      ]);
    });
  });

  describe('getCustomerData', () => {
    it('should return customer data when successful', async () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          name: 'Customer A',
          created_at: '2025-12-12T10:00:00Z'
        },
        {
          id: '2',
          name: 'Customer B',
          created_at: '2025-12-12T11:00:00Z'
        }
      ];
      
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await businessDataService.getCustomerData();

      // Assert
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('customers');
      expect(result).toEqual(mockData);
    });
  });

  describe('getInventoryData', () => {
    it('should return inventory data when successful', async () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          product_name: 'Product A',
          stock_quantity: 100,
          cost_price: 50
        },
        {
          id: '2',
          product_name: 'Product B',
          stock_quantity: 5,
          cost_price: 100
        }
      ];
      
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await businessDataService.getInventoryData();

      // Assert
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(result).toEqual([
        {
          id: '1',
          name: 'Product A',
          quantity: 100,
          unitPrice: 50,
          minStock: 10
        },
        {
          id: '2',
          name: 'Product B',
          quantity: 5,
          unitPrice: 100,
          minStock: 10
        }
      ]);
    });
  });

  describe('calculateBusinessData', () => {
    it('should calculate business data correctly', async () => {
      // Arrange
      const mockSalesData = [
        { totalAmount: 1000, status: 'completed' },
        { totalAmount: 2000, status: 'pending' },
        { totalAmount: 3000, status: 'completed' }
      ];

      const mockLeadData = [
        { qualified: true },
        { qualified: true },
        { qualified: false }
      ];

      const mockCustomerData = [{}, {}];

      const mockInventoryData = [
        { quantity: 100, unitPrice: 50, minStock: 10 },
        { quantity: 5, unitPrice: 100, minStock: 10 }
      ];

      // Mock the service methods
      const getSalesDataSpy = vi.spyOn(businessDataService, 'getSalesData').mockResolvedValue(mockSalesData as any);
      const getLeadDataSpy = vi.spyOn(businessDataService, 'getLeadData').mockResolvedValue(mockLeadData as any);
      const getCustomerDataSpy = vi.spyOn(businessDataService, 'getCustomerData').mockResolvedValue(mockCustomerData as any);
      const getInventoryDataSpy = vi.spyOn(businessDataService, 'getInventoryData').mockResolvedValue(mockInventoryData as any);

      // Act
      const result = await businessDataService.calculateBusinessData('2025-12-12');

      // Assert
      expect(result).toEqual({
        date: '2025-12-12',
        totalSales: 6000,
        totalOrders: 3,
        newCustomers: 2,
        pendingOrders: 1,
        completedOrders: 2,
        totalLeads: 3,
        qualifiedLeads: 2,
        leadConversionRate: (2/3) * 100,
        avgOrderValue: 2000,
        inventoryValue: 5500,
        lowStockItems: 1
      });

      // Cleanup
      getSalesDataSpy.mockRestore();
      getLeadDataSpy.mockRestore();
      getCustomerDataSpy.mockRestore();
      getInventoryDataSpy.mockRestore();
    });
  });

  describe('getFormattedBusinessData', () => {
    it('should return formatted business data for Feishu', async () => {
      // Arrange
      const mockBusinessData = {
        date: '2025-12-12',
        totalSales: 6000,
        totalOrders: 3,
        newCustomers: 2,
        pendingOrders: 1,
        completedOrders: 2,
        totalLeads: 3,
        qualifiedLeads: 2,
        leadConversionRate: (2/3) * 100,
        avgOrderValue: 2000,
        inventoryValue: 5500,
        lowStockItems: 1
      };

      // Mock the calculateBusinessData method
      const calculateBusinessDataSpy = vi.spyOn(businessDataService, 'calculateBusinessData').mockResolvedValue(mockBusinessData as any);

      // Act
      const result = await businessDataService.getFormattedBusinessData('2025-12-12');

      // Assert
      expect(result).toEqual({
        日期: '2025-12-12',
        总销售额: 6000,
        总订单数: 3,
        新增客户数: 2,
        待处理订单数: 1,
        已完成订单数: 2,
        总线索数: 3,
        合格线索数: 2,
        线索转化率: ((2/3) * 100) / 100,
        平均订单价值: 2000,
        库存价值: 5500,
        低库存商品数: 1
      });

      // Cleanup
      calculateBusinessDataSpy.mockRestore();
    });
  });
});
