import { describe, it, expect, vi, beforeEach } from 'vitest';

import { teamService, fetchTeams, createTeam, inviteTeamMember, removeTeamMember, updateTeamMemberRole } from '../teams.client';

// 模拟 fetch API
global.fetch = vi.fn();

// 测试数据
const mockTeams: any[] = [
  {
    id: 'team-1',
    name: '销售团队',
    description: '负责销售业务的团队',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'team-2',
    name: '技术团队',
    description: '负责技术开发的团队',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  }
];

const mockTeam: any = {
  id: 'team-3',
  name: '新团队',
  description: '新创建的团队',
  createdAt: '2023-01-03T00:00:00Z',
  updatedAt: '2023-01-03T00:00:00Z'
};

const mockTeamMember: any = {
  id: 'member-1',
  userId: 'user-1',
  teamId: 'team-1',
  role: 'member',
  invitedAt: '2023-01-04T00:00:00Z'
};

describe('Teams Client Service', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });

  describe('getUserTeams', () => {
    it('should fetch user teams successfully', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ teams: mockTeams })
      });

      // Act
      const result = await teamService.getUserTeams();
      const resultUsingAlias = await fetchTeams();

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/system/teams', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockTeams);
      expect(resultUsingAlias).toEqual(mockTeams);
    });

    it('should handle fetch failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: '服务器错误' })
      });

      // Act & Assert
      await expect(teamService.getUserTeams()).rejects.toThrow('服务器错误');
    });

    it('should handle empty response', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      });

      // Act
      const result = await teamService.getUserTeams();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('createTeam', () => {
    it('should create a new team successfully', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ team: mockTeam })
      });

      // Act
      const result = await teamService.createTeam('新团队', '新创建的团队');
      const resultUsingAlias = await createTeam('新团队', '新创建的团队');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/system/teams', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '新团队', description: '新创建的团队' })
      });
      expect(result).toEqual(mockTeam);
      expect(resultUsingAlias).toEqual(mockTeam);
    });

    it('should create a new team without description', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ team: mockTeam })
      });

      // Act
      const result = await teamService.createTeam('新团队');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/system/teams', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '新团队', description: undefined })
      });
      expect(result).toEqual(mockTeam);
    });

    it('should handle creation failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: '创建团队失败' })
      });

      // Act & Assert
      await expect(teamService.createTeam('新团队')).rejects.toThrow('创建团队失败');
    });
  });

  describe('inviteMember', () => {
    it('should invite a team member successfully', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ member: mockTeamMember })
      });

      // Act
      const result = await teamService.inviteMember('team-1', '13800138000', 'member');
      const resultUsingAlias = await inviteTeamMember('team-1', '13800138000', 'member');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/system/teams/team-1/members', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: '13800138000', role: 'member' })
      });
      expect(result).toEqual(mockTeamMember);
      expect(resultUsingAlias).toEqual(mockTeamMember);
    });

    it('should handle invitation failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: '邀请失败' })
      });

      // Act & Assert
      await expect(teamService.inviteMember('team-1', '13800138000', 'member')).rejects.toThrow('邀请失败');
    });
  });

  describe('removeMember', () => {
    it('should remove a team member successfully', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      });

      // Act
      const result = await teamService.removeMember('team-1', 'member-1');
      const resultUsingAlias = await removeTeamMember('team-1', 'member-1');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/system/teams/team-1/members', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: 'member-1' })
      });
      expect(result).toBeUndefined();
      expect(resultUsingAlias).toBeUndefined();
    });

    it('should handle removal failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: '移除失败' })
      });

      // Act & Assert
      await expect(teamService.removeMember('team-1', 'member-1')).rejects.toThrow('移除失败');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      // Arrange
      const updatedMember = { ...mockTeamMember, role: 'admin' };
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ member: updatedMember })
      });

      // Act
      const result = await teamService.updateMemberRole('team-1', 'member-1', 'admin');
      const resultUsingAlias = await updateTeamMemberRole('team-1', 'member-1', 'admin');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/system/teams/team-1/members', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: 'member-1', role: 'admin' })
      });
      expect(result).toEqual(updatedMember);
      expect(resultUsingAlias).toEqual(updatedMember);
    });

    it('should handle role update failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: '更新角色失败' })
      });

      // Act & Assert
      await expect(teamService.updateMemberRole('team-1', 'member-1', 'admin')).rejects.toThrow('更新角色失败');
    });
  });
});
