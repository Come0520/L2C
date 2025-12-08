import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getApplicableCoefficient,
  calculateOrderPoints,
  processOrderPoints,
  confirmOrderPoints,
} from '../coefficient';

// Mock Supabase client
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('Coefficient Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getApplicableCoefficient', () => {
    it('应返回精确匹配的系数(产品+地区)', async () => {
      const mockRule = {
        id: 'rule-1',
        product_category: 'curtain',
        region_code: 'BJ',
        final_coefficient: 0.012,
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockRule],
          error: null,
        }),
      });

      const coefficient = await getApplicableCoefficient({
        productCategory: 'curtain',
        regionCode: 'BJ',
        orderTime: new Date('2024-12-15'),
      });

      expect(coefficient).toBe(0.012);
    });

    it('应选择系数最高的规则', async () => {
      const mockRules = [
        { final_coefficient: 0.015 },
        { final_coefficient: 0.010 },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockRules[0]], // 已按降序排序
          error: null,
        }),
      });

      const coefficient = await getApplicableCoefficient({
        productCategory: 'curtain',
        regionCode: 'BJ',
        orderTime: new Date(),
      });

      expect(coefficient).toBe(0.015);
    });

    it('应只匹配status=active的规则', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getApplicableCoefficient({
        productCategory: 'curtain',
        regionCode: 'BJ',
        orderTime: new Date(),
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('无匹配规则时返回默认系数', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const coefficient = await getApplicableCoefficient({
        productCategory: 'curtain',
        regionCode: 'BJ',
        orderTime: new Date(),
      });

      expect(coefficient).toBe(0.008); // 窗帘默认系数
    });

    it('窗帘默认系数应为0.008', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const coefficient = await getApplicableCoefficient({
        productCategory: 'curtain',
        regionCode: 'BJ',
        orderTime: new Date(),
      });

      expect(coefficient).toBe(0.008);
    });

    it('处理数据库错误应返回默认系数', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const coefficient = await getApplicableCoefficient({
        productCategory: 'curtain',
        regionCode: 'BJ',
        orderTime: new Date(),
      });

      expect(coefficient).toBe(0.008);
    });

    it('未知品类应返回默认系数0.008', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const coefficient = await getApplicableCoefficient({
        productCategory: 'unknown',
        regionCode: 'BJ',
        orderTime: new Date(),
      });

      expect(coefficient).toBe(0.008);
    });
  });

  describe('calculateOrderPoints', () => {
    it('应正确计算积分(向下取整)', () => {
      const points = calculateOrderPoints(10000, 0.008);
      expect(points).toBe(80);
    });

    it('¥10,000 × 0.8% = 80分', () => {
      const points = calculateOrderPoints(10000, 0.008);
      expect(points).toBe(80);
    });

    it('¥10,500 × 1.2% = 126分', () => {
      const points = calculateOrderPoints(10500, 0.012);
      expect(points).toBe(126);
    });

    it('小数点后向下取整', () => {
      const points = calculateOrderPoints(10555, 0.008);
      expect(points).toBe(84); // 84.44 → 84
    });

    it('小于1分的应返回0', () => {
      const points = calculateOrderPoints(50, 0.008);
      expect(points).toBe(0); // 0.4 → 0
    });

    it('处理大额订单', () => {
      const points = calculateOrderPoints(1000000, 0.012);
      expect(points).toBe(12000);
    });
  });

  describe('processOrderPoints', () => {
    it('应成功调用points_to_pending函数', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ final_coefficient: 0.012 }],
          error: null,
        }),
      });

      mockRpc.mockResolvedValue({ error: null });

      await processOrderPoints({
        userId: 'user-1',
        orderId: 'order-1',
        orderAmount: 10000,
        productCategory: 'curtain',
        regionCode: 'BJ',
      });

      expect(mockRpc).toHaveBeenCalledWith('points_to_pending', expect.objectContaining({
        p_user_id: 'user-1',
        p_source_id: 'order-1',
        p_amount: 120, // 10000 * 0.012
      }));
    });

    it('应返回正确的points和coefficient', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ final_coefficient: 0.01 }],
          error: null,
        }),
      });

      mockRpc.mockResolvedValue({ error: null });

      const result = await processOrderPoints({
        userId: 'user-1',
        orderId: 'order-1',
        orderAmount: 10000,
        productCategory: 'curtain',
        regionCode: 'BJ',
      });

      expect(result).toEqual({
        points: 100,
        coefficient: 0.01,
      });
    });

    it('积分描述应包含系数信息', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ final_coefficient: 0.012 }],
          error: null,
        }),
      });

      mockRpc.mockResolvedValue({ error: null });

      await processOrderPoints({
        userId: 'user-1',
        orderId: 'order-1',
        orderAmount: 10000,
        productCategory: 'curtain',
        regionCode: 'BJ',
      });

      expect(mockRpc).toHaveBeenCalledWith('points_to_pending', expect.objectContaining({
        p_description: expect.stringContaining('1.20%'),
      }));
    });

    it('数据库错误应抛出异常', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ final_coefficient: 0.008 }],
          error: null,
        }),
      });

      mockRpc.mockResolvedValue({
        error: { message: 'Database error' },
      });

      await expect(
        processOrderPoints({
          userId: 'user-1',
          orderId: 'order-1',
          orderAmount: 10000,
          productCategory: 'curtain',
          regionCode: 'BJ',
        })
      ).rejects.toThrow('积分入账失败');
    });
  });

  describe('confirm OrderPoints', () => {
    it('应成功调用confirm_pending_points函数', async () => {
      mockRpc.mockResolvedValue({ error: null });

      await confirmOrderPoints({
        userId: 'user-1',
        orderId: 'order-1',
        points: 100,
      });

      expect(mockRpc).toHaveBeenCalledWith('confirm_pending_points', {
        p_user_id: 'user-1',
        p_source_id: 'order-1',
        p_amount: 100,
        p_description: '订单验收,100积分转为可用',
      });
    });

    it('积分描述应说明转为可用', async () => {
      mockRpc.mockResolvedValue({ error: null });

      await confirmOrderPoints({
        userId: 'user-1',
        orderId: 'order-1',
        points: 80,
      });

      expect(mockRpc).toHaveBeenCalledWith('confirm_pending_points', expect.objectContaining({
        p_description: expect.stringContaining('转为可用'),
      }));
    });

    it('数据库错误应抛出异常', async () => {
      mockRpc.mockResolvedValue({
        error: { message: 'Database error' },
      });

      await expect(
        confirmOrderPoints({
          userId: 'user-1',
          orderId: 'order-1',
          points: 100,
        })
      ).rejects.toThrow('积分确认失败');
    });
  });
});
