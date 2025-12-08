// 团队成员角色类型
export type TeamMemberRole = 'member' | 'admin';

// 团队成员接口
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  role: TeamMemberRole;
  joined_at: string;
  is_online: boolean;
}

// 团队接口
export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  member_count: number;
  members: TeamMember[];
}