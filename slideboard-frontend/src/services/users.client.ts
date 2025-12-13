import { createClient } from '@/lib/supabase/client';
import { User, UserRole } from '@/shared/types/user';

export interface SystemUser extends User {
  department?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  permissions: string[];
}

class UsersService {
  /**
   * Get all users
   */
  async getUsers(): Promise<SystemUser[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, phone, raw_user_meta_data, created_at, updated_at, role');

    if (error) throw new Error(error.message);

    return (data || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      phone: user.phone || user.raw_user_meta_data?.phone,
      name: user.raw_user_meta_data?.name || 'Unknown',
      avatarUrl: user.raw_user_meta_data?.avatar_url,
      role: (user.raw_user_meta_data?.role as UserRole) || 'user',
      department: user.raw_user_meta_data?.department || '',
      status: 'active', // Default to active as we don't have status in auth.users by default
      lastLogin: user.updated_at, // Using updated_at as proxy for last login
      permissions: [], // Permissions are usually derived from role
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<SystemUser | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, phone, raw_user_meta_data, created_at, updated_at, role')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const user = data as any;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone || user.raw_user_meta_data?.phone,
      name: user.raw_user_meta_data?.name || 'Unknown',
      avatarUrl: user.raw_user_meta_data?.avatar_url,
      role: (user.raw_user_meta_data?.role as UserRole) || 'user',
      department: user.raw_user_meta_data?.department || '',
      status: 'active',
      lastLogin: user.updated_at,
      permissions: [],
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}

export const usersService = new UsersService();
