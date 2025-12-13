import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserTeams, getTeamById } from '../teams.server';

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-123' } },
          error: null
        })
      }
    })
  };
});

describe('teams.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserTeams', () => {
    it('should retrieve all teams for current user successfully', async () => {
      // Act
      const result = await getUserTeams();
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getTeamById', () => {
    it('should retrieve a single team by id successfully', async () => {
      // Act
      const result = await getTeamById('team-123');
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 'team-123');
      expect(result).toHaveProperty('members');
      expect(Array.isArray(result.members)).toBe(true);
    });
  });
});
