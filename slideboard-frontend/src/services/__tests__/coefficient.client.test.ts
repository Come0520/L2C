import { describe, it, expect, beforeEach, vi } from 'vitest';
import { coefficientService } from '../coefficient.client';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('CoefficientService', () => {
  // 创建mock查询对象
  const createMockQuery = (data: any = null, error: any = null) => {
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: any) => onFulfilled({ data, error })),
      async: vi.fn().mockReturnThis()
    };
    return mockQuery;
  };

  // 创建mock supabase客户端
  const createMockSupabaseClient = (authUser: any = null, data: any = null, error: any = null) => {
    const mockQuery = createMockQuery(data, error);
    return {
      from: vi.fn(() => mockQuery),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: authUser } })
      }
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rule Management', () => {
    describe('getRules', () => {
      it('should return coefficient rules when successful', async () => {
        // Arrange
        const mockData = [
          { id: '1', rule_code: 'COEF_123', status: 'approved' },
          { id: '2', rule_code: 'COEF_456', status: 'pending_approval' }
        ];
        const mockSupabaseClient = createMockSupabaseClient(null, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getRules();

        // Assert
        expect(createClient).toHaveBeenCalled();
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('points_coefficient_rules');
        expect(result).toEqual(mockData);
      });

      it('should filter by status when provided', async () => {
        // Arrange
        const mockData = [
          { id: '1', rule_code: 'COEF_123', status: 'approved' }
        ];
        const mockQuery = createMockQuery(mockData);
        mockQuery.eq = vi.fn().mockReturnThis();
        
        const mockSupabaseClient = {
          from: vi.fn(() => mockQuery),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        await coefficientService.getRules('approved');

        // Assert
        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved');
      });
    });

    describe('getMyRules', () => {
      it('should return my rules when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user123' };
        const mockData = [
          { id: '1', rule_code: 'COEF_123', created_by: 'user123' },
          { id: '2', rule_code: 'COEF_456', created_by: 'user123' }
        ];
        const mockSupabaseClient = createMockSupabaseClient(mockUser, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getMyRules();

        // Assert
        expect(result).toEqual(mockData);
      });

      it('should return empty array when not authenticated', async () => {
        // Arrange
        const mockSupabaseClient = createMockSupabaseClient(null);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getMyRules();

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('getRuleById', () => {
      it('should return rule by id when found', async () => {
        // Arrange
        const mockData = { id: '1', rule_code: 'COEF_123' };
        const mockSupabaseClient = createMockSupabaseClient(null, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getRuleById('1');

        // Assert
        expect(result).toEqual(mockData);
      });

      it('should return null when rule not found', async () => {
        // Arrange
        const mockError = { code: 'PGRST116' };
        const mockSupabaseClient = {
          from: vi.fn(() => createMockQuery(null, mockError)),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getRuleById('non-existent-id');

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('createRule', () => {
      it('should create rule when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user123' };
        const mockRule = { id: '1', rule_code: 'COEF_123', created_by: 'user123', status: 'draft' };
        
        const mockQuery = createMockQuery(mockRule);
        const mockSupabaseClient = {
          from: vi.fn(() => mockQuery),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        const createParams = {
          name: 'Test Rule',
          description: 'Test Description',
          coefficient_value: 1.5,
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        // Act
        const result = await coefficientService.createRule(createParams);

        // Assert
        expect(result).toEqual(mockRule);
      });

      it('should throw error when not authenticated', async () => {
        // Arrange
        const mockSupabaseClient = {
          from: vi.fn(() => createMockQuery()),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        const createParams = {
          name: 'Test Rule',
          description: 'Test Description',
          coefficient_value: 1.5,
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        // Act & Assert
        await expect(coefficientService.createRule(createParams)).rejects.toThrow('User not authenticated');
      });
    });

    describe('updateRule', () => {
      it('should update rule when successful', async () => {
        // Arrange
        const mockData = { id: '1', rule_code: 'COEF_123', status: 'draft' };
        const mockSupabaseClient = createMockSupabaseClient(null, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        const updateParams = {
          name: 'Updated Rule',
          coefficient_value: 2.0
        };

        // Act
        const result = await coefficientService.updateRule('1', updateParams);

        // Assert
        expect(result).toEqual(mockData);
      });
    });

    describe('deleteRule', () => {
      it('should delete rule when successful', async () => {
        // Arrange
        const mockSupabaseClient = createMockSupabaseClient(null, null);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        await coefficientService.deleteRule('1');

        // Assert
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('points_coefficient_rules');
      });
    });
  });

  describe('Approval Management', () => {
    describe('createApproval', () => {
      it('should create approval and update rule status when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user123' };
        const mockApproval = { 
          id: 'app1', 
          approval_no: 'PCA123', 
          status: 'pending_channel',
          submitted_by: 'user123' 
        };

        let mockQueryCallCount = 0;
        const mockQuery = vi.fn(() => {
          mockQueryCallCount++;
          return createMockQuery(mockQueryCallCount === 2 ? mockApproval : null);
        });
        
        const mockSupabaseClient = {
          from: mockQuery,
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        const createParams = {
          rule_ids: ['rule1', 'rule2'],
          channel_id: 'channel1',
          comment: 'Please approve these rules'
        };

        // Act
        const result = await coefficientService.createApproval(createParams);

        // Assert
        expect(result).toEqual(mockApproval);
        expect(mockQueryCallCount).toBe(2); // First call to update rules, second call to create approval
      });
    });

    describe('getMyApprovals', () => {
      it('should return my approvals when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user123' };
        const mockData = [
          { id: 'app1', approval_no: 'PCA123', submitted_by: 'user123' },
          { id: 'app2', approval_no: 'PCA456', submitted_by: 'user123' }
        ];
        const mockSupabaseClient = createMockSupabaseClient(mockUser, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getMyApprovals();

        // Assert
        expect(result).toEqual(mockData);
      });

      it('should return empty array when not authenticated', async () => {
        // Arrange
        const mockSupabaseClient = createMockSupabaseClient(null);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getMyApprovals();

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('getPendingChannelApprovals', () => {
      it('should return pending channel approvals', async () => {
        // Arrange
        const mockData = [
          { id: 'app1', approval_no: 'PCA123', status: 'pending_channel' },
          { id: 'app2', approval_no: 'PCA456', status: 'pending_channel' }
        ];
        const mockSupabaseClient = createMockSupabaseClient(null, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getPendingChannelApprovals();

        // Assert
        expect(result).toEqual(mockData);
      });
    });

    describe('getPendingLeaderApprovals', () => {
      it('should return pending leader approvals', async () => {
        // Arrange
        const mockData = [
          { id: 'app1', approval_no: 'PCA123', status: 'pending_leader' },
          { id: 'app2', approval_no: 'PCA456', status: 'pending_leader' }
        ];
        const mockSupabaseClient = createMockSupabaseClient(null, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await coefficientService.getPendingLeaderApprovals();

        // Assert
        expect(result).toEqual(mockData);
      });
    });

    describe('channelApprove', () => {
      it('should approve channel approval when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user123' };
        const mockApproval = { 
          id: 'app1', 
          rule_ids: ['rule1', 'rule2'] 
        };

        let mockQueryCallCount = 0;
        const mockQuery = vi.fn(() => {
          mockQueryCallCount++;
          return createMockQuery(mockQueryCallCount === 2 ? mockApproval : null);
        });
        
        const mockSupabaseClient = {
          from: mockQuery,
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        const approveParams = {
          approval_id: 'app1',
          approved: true,
          comment: 'Approved by channel'
        };

        // Act
        await coefficientService.channelApprove(approveParams);

        // Assert
        expect(mockQueryCallCount).toBe(1); // Only one call when approved (no need to update rules)
      });

      it('should reject channel approval and update rule status when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user123' };
        const mockApproval = { 
          id: 'app1', 
          rule_ids: ['rule1', 'rule2'] 
        };

        let mockQueryCallCount = 0;
        const mockQuery = vi.fn(() => {
          mockQueryCallCount++;
          return createMockQuery(mockQueryCallCount === 2 ? mockApproval : null);
        });
        
        const mockSupabaseClient = {
          from: mockQuery,
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        const approveParams = {
          approval_id: 'app1',
          approved: false,
          comment: 'Rejected by channel'
        };

        // Act
        await coefficientService.channelApprove(approveParams);

        // Assert
        expect(mockQueryCallCount).toBe(3); // First call to update approval, second to get approval, third to update rules
      });
    });

    describe('leaderApprove', () => {
      it('should approve leader approval and update rule status when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user123' };
        const mockApproval = { 
          id: 'app1', 
          rule_ids: ['rule1', 'rule2'] 
        };

        let mockQueryCallCount = 0;
        const mockQuery = vi.fn(() => {
          mockQueryCallCount++;
          return createMockQuery(mockQueryCallCount === 2 ? mockApproval : null);
        });
        
        const mockSupabaseClient = {
          from: mockQuery,
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        const approveParams = {
          approval_id: 'app1',
          approved: true,
          comment: 'Approved by leader'
        };

        // Act
        await coefficientService.leaderApprove(approveParams);

        // Assert
        expect(mockQueryCallCount).toBe(3); // First call to update approval, second to get approval, third to update rules
      });
    });

    describe('cancelApproval', () => {
      it('should cancel approval and update rule status when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user123' };
        const mockApproval = { 
          id: 'app1', 
          rule_ids: ['rule1', 'rule2'],
          submitted_by: 'user123' 
        };

        let mockQueryCallCount = 0;
        const mockQuery = vi.fn(() => {
          mockQueryCallCount++;
          return createMockQuery(mockQueryCallCount === 2 ? mockApproval : null);
        });
        
        const mockSupabaseClient = {
          from: mockQuery,
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        await coefficientService.cancelApproval('app1');

        // Assert
        expect(mockQueryCallCount).toBe(3); // First call to update approval, second to get approval, third to update rules
      });
    });
  });
});
