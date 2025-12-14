import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { installationTeamService } from '../installation-team.client';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('InstallationTeamService', () => {
  // 创建mock查询对象
  const createMockQuery = (data: any = null, count: number | null = null, error: any = null) => {
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: any) => onFulfilled({ data, count, error })),
      async: vi.fn().mockReturnThis()
    };
    return mockQuery;
  };

  // 创建mock supabase客户端
  const createMockSupabaseClient = (authUser: any = null, data: any = null, count: number | null = null, error: any = null) => {
    const mockQuery = createMockQuery(data, count, error);
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

  describe('Team Management', () => {
    describe('getInstallationTeams', () => {
      it('should return installation teams with pagination', async () => {
        // Arrange
        const mockData = [
          {
            id: 1,
            name: '安装队A',
            status: 'active',
            team_leader_id: 'user1',
            total_members: 3,
            completed_installations: 10,
            average_rating: 4.5,
            created_at: '2025-12-10T00:00:00Z',
            updated_at: '2025-12-10T00:00:00Z',
            team_leader: { name: '张三' }
          }
        ];
        const mockSupabaseClient = createMockSupabaseClient(null, mockData, 1);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationTeamService.getInstallationTeams({ page: 1, pageSize: 10 });

        // Assert
        expect(result.teams).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.teams[0].name).toBe('安装队A');
        expect(result.teams[0].teamLeaderName).toBe('张三');
      });
    });

    describe('getInstallationTeamById', () => {
      it('should return installation team by id', async () => {
        // Arrange
        const mockData = {
          id: 1,
          name: '安装队A',
          status: 'active',
          team_leader_id: 'user1',
          total_members: 3,
          completed_installations: 10,
          average_rating: 4.5,
          created_at: '2025-12-10T00:00:00Z',
          updated_at: '2025-12-10T00:00:00Z',
          team_leader: { name: '张三' },
          team_members: [
            {
              installer_id: 'installer1',
              installer: { name: '李四', skill_level: 'senior' }
            },
            {
              installer_id: 'installer2',
              installer: { name: '王五', skill_level: 'intermediate' }
            }
          ]
        };
        const mockSupabaseClient = createMockSupabaseClient(null, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationTeamService.getInstallationTeamById('1');

        // Assert
        expect(result.id).toBe('1');
        expect(result.name).toBe('安装队A');
        expect(result.teamLeaderName).toBe('张三');
        expect(result.teamMembers).toHaveLength(2);
      });
    });
  });

  describe('Installer Management', () => {
    describe('getInstallers', () => {
      it('should return installers with pagination', async () => {
        // Arrange
        const mockData = [
          {
            id: 'installer1',
            name: '李四',
            phone: '13800138000',
            status: 'active',
            skill_level: 'senior',
            team_id: 1,
            performance_rating: 4.8,
            completed_installations: 50,
            created_at: '2025-12-10T00:00:00Z',
            updated_at: '2025-12-10T00:00:00Z',
            team: { name: '安装队A' }
          }
        ];
        const mockSupabaseClient = createMockSupabaseClient(null, mockData, 1);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationTeamService.getInstallers({ page: 1, pageSize: 10 });

        // Assert
        expect(result.installers).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.installers[0].name).toBe('李四');
        expect(result.installers[0].skillLevel).toBe('senior');
        expect(result.installers[0].teamName).toBe('安装队A');
      });
    });

    describe('getInstallerById', () => {
      it('should return installer by id', async () => {
        // Arrange
        const mockData = {
          id: 'installer1',
          user_id: 'user2',
          name: '李四',
          phone: '13800138000',
          status: 'active',
          skill_level: 'senior',
          team_id: 1,
          performance_rating: 4.8,
          completed_installations: 50,
          created_at: '2025-12-10T00:00:00Z',
          updated_at: '2025-12-10T00:00:00Z',
          team: { name: '安装队A' }
        };
        const mockSupabaseClient = createMockSupabaseClient(null, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationTeamService.getInstallerById('installer1');

        // Assert
        expect(result.id).toBe('installer1');
        expect(result.name).toBe('李四');
        expect(result.teamName).toBe('安装队A');
      });
    });
  });

  describe('Team Member Management', () => {
    describe('addTeamMember', () => {
      it('should add a team member to a team', async () => {
        // Arrange
        let queryCallCount = 0;
        const mockSupabaseClient = {
          from: vi.fn(() => {
            queryCallCount++;
            return {
              select: vi.fn().mockReturnThis(),
              insert: vi.fn().mockReturnThis(),
              update: vi.fn().mockReturnThis(),
              delete: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockReturnThis(),
              then: vi.fn((onFulfilled: any) => {
                if (queryCallCount === 1) {
                  // Check existing team
                  return onFulfilled({ data: { team_id: null }, count: null, error: null });
                } else if (queryCallCount === 2) {
                  // Add to team members
                  return onFulfilled({ data: null, count: null, error: null });
                } else if (queryCallCount === 3) {
                  // Update installer's team_id
                  return onFulfilled({ data: null, count: null, error: null });
                } else if (queryCallCount === 4) {
                  // Get team total members
                  return onFulfilled({ data: { total_members: 2 }, count: null, error: null });
                } else if (queryCallCount === 5) {
                  // Update team total members
                  return onFulfilled({ data: null, count: null, error: null });
                }
                return onFulfilled({ data: null, count: null, error: null });
              })
            };
          }),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        await installationTeamService.addTeamMember('1', 'installer1');

        // Assert
        expect(queryCallCount).toBe(5);
      });
    });

    describe('removeTeamMember', () => {
      it('should remove a team member from a team', async () => {
        // Arrange
        let queryCallCount = 0;
        const mockSupabaseClient = {
          from: vi.fn(() => {
            queryCallCount++;
            return {
              delete: vi.fn().mockReturnThis(),
              update: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockReturnThis(),
              insert: vi.fn().mockReturnThis(),
              then: vi.fn((onFulfilled: any) => {
                if (queryCallCount === 1) {
                  // Remove from team members
                  return onFulfilled({ data: null, count: null, error: null });
                } else if (queryCallCount === 2) {
                  // Update installer's team_id to null
                  return onFulfilled({ data: null, count: null, error: null });
                } else if (queryCallCount === 3) {
                  // Get team total members
                  return onFulfilled({ data: { total_members: 3 }, count: null, error: null });
                } else if (queryCallCount === 4) {
                  // Update team total members
                  return onFulfilled({ data: null, count: null, error: null });
                }
                return onFulfilled({ data: null, count: null, error: null });
              })
            };
          }),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        await installationTeamService.removeTeamMember('1', 'installer1');

        // Assert
        expect(queryCallCount).toBe(4);
      });
    });
  });

  describe('User Binding', () => {
    describe('getInstallerBindingStatus', () => {
      it('should get installer binding status', async () => {
        // Arrange
        const mockUser = { id: 'user1' };
        const mockData = [{ id: 'installer1' }];
        const mockSupabaseClient = {
          from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => onFulfilled({ data: mockData, count: null, error: null }))
          })),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationTeamService.getInstallerBindingStatus();

        // Assert
        expect(result.matchedByUid).toBe(true);
        expect(result.userId).toBe('user1');
      });

      it('should return false when no binding found', async () => {
        // Arrange
        const mockUser = { id: 'user1' };
        const mockSupabaseClient = {
          from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => onFulfilled({ data: [], count: null, error: null }))
          })),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationTeamService.getInstallerBindingStatus();

        // Assert
        expect(result.matchedByUid).toBe(false);
        expect(result.userId).toBe('user1');
      });
    });

    describe('bindCurrentUser', () => {
      it('should bind current user when authenticated', async () => {
        // Arrange
        const mockUser = { id: 'user1' };
        const mockSupabaseClient = {
          from: vi.fn(),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationTeamService.bindCurrentUser();

        // Assert
        expect(result.success).toBe(true);
        expect(result.userId).toBe('user1');
      });

      it('should return failure when not authenticated', async () => {
        // Arrange
        const mockSupabaseClient = {
          from: vi.fn(),
          rpc: vi.fn(),
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } })
          }
        };
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationTeamService.bindCurrentUser();

        // Assert
        expect(result.success).toBe(false);
        expect(result.userId).toBe(null);
      });
    });
  });
});
