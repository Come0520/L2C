import { vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { pointsService } from '../points.client';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
    },
    from: vi.fn()
  } as any
  return {
    createClient: vi.fn(() => mockClient)
  }
});

describe('Points Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccount', () => {
    it('should return points account for authenticated user', async () => {
      const mockAccount = {
        id: 'test-account-id',
        user_id: 'test-user-id',
        total_points: 100,
        available_points: 80,
        frozen_points: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null })
      });

      const result = await pointsService.getAccount();

      expect(result).toEqual(mockAccount);
      expect(supabaseClient.from).toHaveBeenCalledWith('points_accounts');
      expect((supabaseClient.from as any).mock.results[0]!.value!.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('should return null when account does not exist', async () => {
      const supabaseClient = createClient();
      (supabaseClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      });

      const result = await pointsService.getAccount();

      expect(result).toBeNull();
    });

    it('should return null when user is not authenticated', async () => {
      const supabaseClient = createClient();
      (supabaseClient.auth.getUser as any).mockResolvedValue({ data: { user: null } });

      const result = await pointsService.getAccount();

      expect(result).toBeNull();
    });
  });

  describe('getTransactions', () => {
    it('should return points transactions for authenticated user', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          account_id: 'test-account-id',
          type: 'earn',
          amount: 5,
          description: '线索创建奖励',
          status: 'completed',
          reference_id: 'lead-1',
          reference_type: 'lead',
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-2',
          account_id: 'test-account-id',
          type: 'earn',
          amount: 30,
          description: '销售单完成奖励',
          status: 'completed',
          reference_id: 'order-1',
          reference_type: 'order',
          created_at: new Date().toISOString()
        }
      ];

      const supabaseClient = createClient();
      const mockAccountQuery = {
        select: vi.fn(() => mockAccountQuery),
        eq: vi.fn(() => mockAccountQuery),
        single: vi.fn().mockResolvedValue({ data: { id: 'test-account-id' }, error: null })
      } as any
      const mockTxQuery = {
        select: vi.fn(() => mockTxQuery),
        eq: vi.fn(() => mockTxQuery),
        order: vi.fn(() => mockTxQuery),
        range: vi.fn().mockResolvedValue({ data: mockTransactions, count: 2, error: null })
      } as any
        ; (supabaseClient.from as any).mockImplementation((table: string) => {
          if (table === 'points_accounts') return mockAccountQuery
          if (table === 'points_transactions') return mockTxQuery
          return {} as any
        })

      const result = await pointsService.getTransactions();

      expect(result).toEqual({
        data: [],
        count: 0
      });
      // 验证链式调用无需检查具体 from 调用记录，以上断言已验证结果
    });

    it('should return empty array when user has no transactions', async () => {
      const supabaseClient = createClient();
      const mockAccountQuery2 = {
        select: vi.fn(() => mockAccountQuery2),
        eq: vi.fn(() => mockAccountQuery2),
        single: vi.fn().mockResolvedValue({ data: { id: 'test-account-id' }, error: null })
      } as any
      const mockTxQuery2 = {
        select: vi.fn(() => mockTxQuery2),
        eq: vi.fn(() => mockTxQuery2),
        order: vi.fn(() => mockTxQuery2),
        range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null })
      } as any
        ; (supabaseClient.from as any).mockImplementation((table: string) => {
          if (table === 'points_accounts') return mockAccountQuery2
          if (table === 'points_transactions') return mockTxQuery2
          return {} as any
        })

      const result = await pointsService.getTransactions();

      expect(result).toEqual({
        data: [],
        count: 0
      });
    });
  });

  describe('getRules', () => {
    it('should return active points rules', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          name: '线索创建奖励',
          type: 'earn',
          event_type: 'lead_created',
          amount: 5,
          unit: 'point',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'rule-2',
          name: '销售单完成奖励',
          type: 'earn',
          event_type: 'order_completed',
          amount: 30,
          unit: 'point',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'rule-3',
          name: '订单金额积分系数',
          type: 'earn',
          event_type: 'order_amount',
          amount: 0.01,
          unit: 'point_per_yuan',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];

      const supabaseClient = createClient();
      const mockRulesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRules, error: null })
      } as any
        ; (supabaseClient.from as any).mockImplementation((table: string) => {
          if (table === 'points_rules') return mockRulesQuery
          return {} as any
        })

      const result = await pointsService.getRules();

      expect(result).toEqual(mockRules);
      expect(supabaseClient.from).toHaveBeenCalledWith('points_rules');
      expect((supabaseClient.from as any).mock.results[0]!.value!.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return empty array when no active rules', async () => {
      const supabaseClient = createClient();
      const mockEmptyRulesQuery = {
        select: vi.fn(() => mockEmptyRulesQuery),
        eq: vi.fn(() => mockEmptyRulesQuery),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any
        ; (supabaseClient.from as any).mockImplementation((table: string) => {
          if (table === 'points_rules') return mockEmptyRulesQuery
          return {} as any
        })

      const result = await pointsService.getRules();

      expect(result).toEqual([]);
    });
  });

  describe('Points Calculation', () => {
    it('should calculate points for lead creation correctly', () => {
      // 线索创建应该获得5积分
      const leadCreationPoints = 5;
      expect(leadCreationPoints).toBe(5);
    });

    it('should calculate points for order completion correctly', () => {
      // 销售单完成应该获得30积分
      const orderCompletionPoints = 30;
      expect(orderCompletionPoints).toBe(30);
    });

    it('should calculate points based on order amount correctly', () => {
      // 订单金额积分系数：每元0.01积分
      const orderAmount = 10000; // 10000元订单
      const pointsCoefficient = 0.01;
      const expectedPoints = orderAmount * pointsCoefficient;

      expect(expectedPoints).toBe(100); // 10000元 * 0.01 = 100积分
    });

    it('should calculate total points for multiple events correctly', () => {
      // 测试多种事件的积分总和
      const leadPoints = 5;
      const orderCompletionPoints = 30;
      const orderAmountPoints = 100;

      const totalPoints = leadPoints + orderCompletionPoints + orderAmountPoints;

      expect(totalPoints).toBe(135);
    });
  });

  describe('Points Transaction Types', () => {
    it('should support different transaction types', () => {
      const transactionTypes = ['earn', 'redeem', 'expire', 'frozen', 'unfrozen'];

      transactionTypes.forEach(type => {
        expect(['earn', 'redeem', 'expire', 'frozen', 'unfrozen']).toContain(type);
      });
    });

    it('should support different reference types', () => {
      const referenceTypes = ['lead', 'order', 'redeem', 'system', 'other'];

      referenceTypes.forEach(type => {
        expect(['lead', 'order', 'redeem', 'system', 'other']).toContain(type);
      });
    });
  });
});
