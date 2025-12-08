import { vi } from 'vitest'

import { pointsService } from '../points.client';

// Mock the supabase client
// Create a more flexible mock system
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn() as any,
  },
};

// 默认返回已登录用户
mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } })

// Create a mock query builder that allows method chaining
const createMockQueryBuilder = () => {
  const mock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
  return mock;
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('pointsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock client to its initial state
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
  });

  describe('getAccount', () => {
    it('should get points account successfully when user is authenticated and account exists', async () => {
      const mockAccount = {
        id: 'test-account-id',
        user_id: 'test-user-id',
        balance: 100,
        total_earned: 200,
        total_used: 100,
      };

      // Create mock query builder
      const mockQuery = createMockQueryBuilder();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.single.mockResolvedValue({
        data: mockAccount,
        error: null,
      });

      // Set up client.from() to return this mock query
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await pointsService.getAccount();

      expect(result).toEqual(mockAccount);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('should return null when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await pointsService.getAccount();

      expect(result).toBeNull();
    });

    it('should return null when account does not exist', async () => {
      const mockQuery = createMockQueryBuilder();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await pointsService.getAccount();

      expect(result).toBeNull();
    });

    it('should throw error when database error occurs', async () => {
      const mockQuery = createMockQueryBuilder();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'some-other-error', message: 'Database error' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(pointsService.getAccount()).rejects.toThrow();
    });
  });

  describe('getTransactions', () => {
    it('should get points transactions successfully when user is authenticated and account exists', async () => {
      const mockAccount = { id: 'test-account-id' };
      const mockTransactions = [
        {
          id: 'transaction-1',
          account_id: 'test-account-id',
          type: 'earn',
          amount: 50,
          description: '完成任务获得积分',
          created_at: new Date().toISOString(),
        },
        {
          id: 'transaction-2',
          account_id: 'test-account-id',
          type: 'spend',
          amount: 20,
          description: '兑换礼品消耗积分',
          created_at: new Date().toISOString(),
        },
      ];

      // Mock first call for account retrieval
      const mockAccountQuery = createMockQueryBuilder();
      mockAccountQuery.select.mockReturnThis();
      mockAccountQuery.eq.mockReturnThis();
      mockAccountQuery.single.mockResolvedValue({ data: mockAccount, error: null });

      // Mock second call for transactions retrieval
      const mockTransactionsQuery = createMockQueryBuilder();
      mockTransactionsQuery.select.mockReturnThis();
      mockTransactionsQuery.eq.mockReturnThis();
      mockTransactionsQuery.range.mockReturnThis();
      mockTransactionsQuery.order.mockResolvedValue({
        data: mockTransactions,
        count: 2,
        error: null,
      });

      // Set up client.from() to return different mocks for each call
      mockSupabaseClient.from.mockReturnValueOnce(mockAccountQuery).mockReturnValueOnce(mockTransactionsQuery);

      const result = await pointsService.getTransactions();

      expect(result).toEqual({
        data: mockTransactions,
        count: 2,
      });
      expect(mockTransactionsQuery.eq).toHaveBeenCalledWith('account_id', 'test-account-id');
    });

    it('should return empty array when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await pointsService.getTransactions();

      expect(result).toEqual({ data: [], count: 0 });
    });

    it('should return empty array when account does not exist', async () => {
      const mockAccountQuery = createMockQueryBuilder();
      mockAccountQuery.select.mockReturnThis();
      mockAccountQuery.eq.mockReturnThis();
      mockAccountQuery.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      mockSupabaseClient.from.mockReturnValue(mockAccountQuery);

      const result = await pointsService.getTransactions();

      expect(result).toEqual({ data: [], count: 0 });
    });

    it('should throw error when database error occurs', async () => {
      const mockAccount = { id: 'test-account-id' };

      // Mock first call for account retrieval
      const mockAccountQuery = createMockQueryBuilder();
      mockAccountQuery.select.mockReturnThis();
      mockAccountQuery.eq.mockReturnThis();
      mockAccountQuery.single.mockResolvedValue({ data: mockAccount, error: null });

      // Mock second call for transactions retrieval (with error)
      const mockTransactionsQuery = createMockQueryBuilder();
      mockTransactionsQuery.select.mockReturnThis();
      mockTransactionsQuery.eq.mockReturnThis();
      mockTransactionsQuery.range.mockReturnThis();
      mockTransactionsQuery.order.mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Database error' },
      });

      // Set up client.from() to return different mocks for each call
      mockSupabaseClient.from.mockReturnValueOnce(mockAccountQuery).mockReturnValueOnce(mockTransactionsQuery);

      await expect(pointsService.getTransactions()).rejects.toThrow();
    });
  });

  describe('getRules', () => {
    it('should get active points rules successfully', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          name: '完成首次登录',
          description: '首次登录获得10积分',
          points: 10,
          condition: 'first_login',
          is_active: true,
        },
        {
          id: 'rule-2',
          name: '完成订单',
          description: '每完成一个订单获得50积分',
          points: 50,
          condition: 'complete_order',
          is_active: true,
        },
      ];

      const mockQuery = createMockQueryBuilder();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.order.mockResolvedValue({
        data: mockRules,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await pointsService.getRules();

      expect(result).toEqual(mockRules);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return empty array when no active rules exist', async () => {
      const mockQuery = createMockQueryBuilder();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.order.mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await pointsService.getRules();

      expect(result).toEqual([]);
    });

    it('should throw error when database error occurs', async () => {
      const mockQuery = createMockQueryBuilder();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(pointsService.getRules()).rejects.toThrow();
    });
  });
});
