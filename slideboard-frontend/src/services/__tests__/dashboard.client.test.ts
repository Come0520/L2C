import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardService } from '../dashboard.client';

// Mock the entire supabase module
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Mock date-fns functions
vi.mock('date-fns', () => ({
  startOfMonth: vi.fn().mockReturnValue(new Date('2025-12-01T00:00:00.000Z')),
  subMonths: vi.fn().mockReturnValue(new Date('2025-11-01T00:00:00.000Z')),
  formatDistanceToNow: vi.fn().mockReturnValue('2小时前')
}));

vi.mock('date-fns/locale', () => ({
  zhCN: {}
}));

import { supabase } from '@/lib/supabase/client';

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardOverview', () => {
    it('should return dashboard overview data when all queries succeed', async () => {
      // Arrange
      // 创建一个通用的mock查询对象，返回预期的数据
      let currentMockIndex = 0;
      
      // 预期的查询结果列表，按照实际查询顺序排列
      const mockResults = [
        // 1. 当前月营收 - sales_orders
        { data: [{ total_amount: 1000 }, { total_amount: 2000 }], count: null, error: null },
        // 2. 上月营收 - sales_orders
        { data: [{ total_amount: 1500 }], count: null, error: null },
        // 3. 新增客户数 - customers
        { data: null, count: 10, error: null },
        // 4. 上月客户数 - customers
        { data: null, count: 5, error: null },
        // 5. 活跃订单数 - sales_orders
        { data: null, count: 5, error: null },
        // 6. 总线索数 - leads
        { data: null, count: 20, error: null },
        // 7. 已赢线索数 - leads
        { data: null, count: 8, error: null },
        // 8. 最近线索 - leads
        { data: [
          { id: '1', name: '客户A', status: 'new', created_at: '2025-12-12T20:00:00Z' },
          { id: '2', name: '客户B', status: 'won', created_at: '2025-12-12T19:00:00Z' }
        ], count: null, error: null },
        // 9. 最近订单 - sales_orders
        { data: [
          { id: '5', sales_no: 'SO001', status: 'pending', total_amount: 1500, created_at: '2025-12-12T18:30:00Z' },
          { id: '6', sales_no: 'SO002', status: 'completed', total_amount: 2500, created_at: '2025-12-12T17:30:00Z' }
        ], count: null, error: null },
        // 10. 待处理线索 - leads
        { data: [
          { id: '3', name: '客户C', status: 'contacted', created_at: '2025-12-12T18:00:00Z' },
          { id: '4', name: '客户D', status: 'following', created_at: '2025-12-12T17:00:00Z' }
        ], count: null, error: null }
      ];
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((onFulfilled: any) => {
          const result = mockResults[currentMockIndex] || { data: null, count: null, error: null };
          currentMockIndex++;
          return onFulfilled(result);
        })
      };
      
      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await dashboardService.getDashboardOverview();

      // Assert
      // 不检查调用次数，直接检查结果
      expect(result.stats).toHaveLength(4);
      expect(result.stats[0].title).toBe('本月总营收');
      expect(result.stats[0].value).toBe('¥3,000');
      expect(result.stats[1].title).toBe('新增客户数');
      expect(result.stats[1].value).toBe('10');
      expect(result.stats[2].title).toBe('活跃订单');
      expect(result.stats[2].value).toBe('5');
      expect(result.stats[3].title).toBe('转化率');
      expect(result.stats[3].value).toBe('40.0%');
      
      expect(result.recentActivities).toHaveLength(4); // 2 leads + 2 orders
      expect(result.pendingTasks).toHaveLength(2); // 2 pending leads
    });

    it('should handle empty data gracefully', async () => {
      // Arrange
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((onFulfilled: any) => onFulfilled({ data: null, count: null, error: null }))
      };

      (supabase.from as vi.Mock).mockReturnValue(mockQuery);

      // Act
      const result = await dashboardService.getDashboardOverview();

      // Assert
      expect(result.stats[0].value).toBe('¥0'); // 营收为0
      expect(result.stats[1].value).toBe('0'); // 客户数为0
      expect(result.stats[2].value).toBe('0'); // 活跃订单数为0
      expect(result.stats[3].value).toBe('0.0%'); // 转化率为0
      expect(result.recentActivities).toHaveLength(0);
      expect(result.pendingTasks).toHaveLength(0);
    });
  });
});
