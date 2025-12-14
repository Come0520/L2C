// Teams and team members types

// 团队成员角色类型
export type TeamMemberRole = 'member' | 'admin';


export interface Team {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  members_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  users?: {
    raw_user_meta_data?: {
      name?: string;
      avatar_url?: string;
    };
  };
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export interface TeamMemberWithDetails extends TeamMember {
  name: string;
  avatar_url?: string;
}
