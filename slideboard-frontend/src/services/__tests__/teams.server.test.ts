import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getUserTeams, getTeamById } from '../teams.server';

const { mockTeamsQuery, mockMembersQuery, mockAuth } = vi.hoisted(() => {
  const createMockQuery = () => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn((resolve) => resolve({ data: [], error: null }))
  });

  return {
    mockTeamsQuery: createMockQuery(),
    mockMembersQuery: createMockQuery(),
    mockAuth: { getUser: vi.fn() }
  }
})

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn((table: string) => {
          if (table === 'teams') return mockTeamsQuery;
          if (table === 'team_members') return mockMembersQuery;
          return mockTeamsQuery;
      }),
      auth: mockAuth
    })
  };
});

describe('teams.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    [mockTeamsQuery, mockMembersQuery].forEach(q => {
        q.select.mockReturnThis();
        q.order.mockReturnThis();
        q.or.mockReturnThis();
        q.eq.mockReturnThis();
        q.single.mockReset();
        q.then = vi.fn((resolve) => resolve({ data: [], error: null }));
    });
    
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-123' } },
      error: null
    });
  });

  describe('getUserTeams', () => {
    it('should retrieve all teams for current user successfully', async () => {
      const mockTeamsData = [{
        id: 'team-1',
        name: 'Team 1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        members: []
      }];
      
      mockTeamsQuery.then.mockImplementation((resolve: any) => resolve({ data: mockTeamsData, error: null }));
      
      const mockMembersData = [{
          id: 'member-1',
          team_id: 'team-1',
          user_id: 'u1',
          role: 'owner',
          users: { raw_user_meta_data: { name: 'User 1' } }
      }];
      mockMembersQuery.then.mockImplementation((resolve: any) => resolve({ data: mockMembersData, error: null }));

      const result = await getUserTeams();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].member_count).toBe(1);
    });
  });

  describe('getTeamById', () => {
    it('should retrieve a single team by id successfully', async () => {
      const mockTeamData = {
        id: 'team-123',
        name: 'Team 123',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        members: []
      };
      
      mockTeamsQuery.single.mockResolvedValue({
        data: mockTeamData,
        error: null
      });

      mockMembersQuery.then.mockImplementation((resolve: any) => resolve({ data: [], error: null }));

      const result = await getTeamById('team-123');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 'team-123');
      expect(result).toHaveProperty('members');
      expect(Array.isArray(result.members)).toBe(true);
    });
  });
});
