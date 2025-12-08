import { Team, TeamMember } from '@/types/teams';

// 团队服务对象
export const TEAM_SERVICE = {
  // 获取用户团队列表
  getUserTeams: async (): Promise<Team[]> => {
    const response = await fetch('/api/system/teams', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      throw new Error(errorResponse.error || '获取团队列表失败');
    }

    const responseData = await response.json();
    return responseData.teams || [];
  },

  // 创建新团队
  createTeam: async (name: string, description?: string): Promise<Team> => {
    const response = await fetch('/api/system/teams', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      throw new Error(errorResponse.error || '创建团队失败');
    }

    const responseData = await response.json();
    return responseData.team;
  },

  // 邀请团队成员
  inviteMember: async (teamId: string, phone: string, role: 'member' | 'admin'): Promise<TeamMember> => {
    const response = await fetch(`/api/system/teams/${teamId}/members`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, role }),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      throw new Error(errorResponse.error || '邀请成员失败');
    }

    const responseData = await response.json();
    return responseData.member;
  },

  // 移除团队成员
  removeMember: async (teamId: string, memberId: string): Promise<void> => {
    const response = await fetch(`/api/system/teams/${teamId}/members`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memberId }),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      throw new Error(errorResponse.error || '移除成员失败');
    }
  },

  // 更新成员角色
  updateMemberRole: async (teamId: string, memberId: string, role: 'member' | 'admin'): Promise<TeamMember> => {
    const response = await fetch(`/api/system/teams/${teamId}/members`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memberId, role }),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      throw new Error(errorResponse.error || '更新角色失败');
    }

    const responseData = await response.json();
    return responseData.member;
  },
};

export const teamService = TEAM_SERVICE;
export const fetchTeams = TEAM_SERVICE.getUserTeams;
export const createTeam = TEAM_SERVICE.createTeam;
export const inviteTeamMember = TEAM_SERVICE.inviteMember;
export const removeTeamMember = TEAM_SERVICE.removeMember;
export const updateTeamMemberRole = TEAM_SERVICE.updateMemberRole;

// 保留独立函数导出，兼容新代码
export const FETCH_TEAMS = TEAM_SERVICE.getUserTeams;
export const CREATE_TEAM = TEAM_SERVICE.createTeam;
export const INVITE_TEAM_MEMBER = TEAM_SERVICE.inviteMember;
export const REMOVE_TEAM_MEMBER = TEAM_SERVICE.removeMember;
export const UPDATE_TEAM_MEMBER_ROLE = TEAM_SERVICE.updateMemberRole;
