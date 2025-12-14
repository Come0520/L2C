import { describe, it, expect, beforeEach, vi } from 'vitest';

import { reconciliationService } from '../reconciliation.client';

// 首先配置mock，确保在导入服务之前生效
vi.mock('@/lib/supabase/client', () => {
  // 创建mock查询对象，用于动态配置返回值
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    // 添加then方法以支持Promise链式调用
    then: vi.fn().mockImplementation((resolve) => {
      resolve({ data: null, error: null });
      return Promise.resolve();
    })
  };

  // 创建mock supabase客户端
  const mockClient = {
    from: vi.fn().mockReturnValue(mockQuery),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null,
      }),
    },
  };

  return {
    supabase: mockClient,
    // 暴露mock对象以便在测试中配置
    __esModule: true,
    // 额外导出mock对象，以便在测试中修改
    __mockClient: mockClient,
    __mockQuery: mockQuery,
  };
});

// 然后导入mock模块
import * as supabaseModule from '@/lib/supabase/client';

// 创建一个辅助函数，用于获取mock对象
const getMockObjects = () => {
  // 从mock模块中获取mock对象
  const mockClient = (supabaseModule as any).__mockClient;
  const mockQuery = (supabaseModule as any).__mockQuery;
  return { mockClient, mockQuery };
};

// 在每个测试套件开始前重置mock
beforeEach(() => {
  vi.clearAllMocks();
});

describe('reconciliationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatements', () => {
    it('should retrieve statements for customer type successfully', async () => {
      // Arrange
      const statementType = 'customer';
      
      // Act
      const result = await reconciliationService.getStatements(statementType);
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should retrieve statements for supplier type successfully', async () => {
      // Arrange
      const statementType = 'supplier';
      
      // Act
      const result = await reconciliationService.getStatements(statementType);
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('createStatement', () => {
    it('should create a statement successfully', async () => {
      // Arrange
      const statementData = {
        type: 'customer',
        targetId: 'target-123',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
        items: [
          {
            sourceType: 'invoice',
            sourceId: 'invoice-123',
            amount: 1000,
            date: '2025-01-15',
          },
          {
            sourceType: 'payment',
            sourceId: 'payment-456',
            amount: -500,
            date: '2025-02-01',
          },
        ],
      };
      
      // 配置mock返回值
      const mockStatement = {
        id: 'statement-123',
        statement_no: 'ST-C-20250101-001',
        type: 'customer',
        target_id: statementData.targetId,
        period_start: statementData.periodStart,
        period_end: statementData.periodEnd,
        total_amount: 500,
        status: 'draft',
        created_by: 'test-user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // 获取mock对象
      const { mockClient, mockQuery } = getMockObjects();
      
      // 配置insert后的single()调用返回mock statement
      mockQuery.insert.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.single.mockResolvedValue({ data: mockStatement, error: null });
      
      // 配置插入items的调用返回成功
      const mockItemsQuery = {
        insert: vi.fn().mockResolvedValue({ data: [{ id: 'item-1' }, { id: 'item-2' }], error: null })
      };
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'reconciliation_items') {
          return mockItemsQuery;
        }
        return mockQuery;
      });
      
      // Act & Assert
      await expect(reconciliationService.createStatement(statementData)).resolves.not.toThrow();
    });

    it('should handle empty items array when creating statement', async () => {
      // Arrange
      const statementData = {
        type: 'supplier',
        targetId: 'target-789',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
        items: [],
      };
      
      // Act & Assert
      await expect(reconciliationService.createStatement(statementData)).resolves.not.toThrow();
    });
  });
});
