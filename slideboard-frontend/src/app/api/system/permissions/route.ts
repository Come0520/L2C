import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// Define request body types
interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
}

// Define database row types
interface RoleRow {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface PermissionRow {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface RolePermissionRow {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

interface UserRoleRow {
  role_id: string;
  user_id: string;
}

interface UserRow {
  role?: 'admin' | 'LEAD_ADMIN' | string;
}

// Define response types
interface RoleWithPermissions {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  permissions: string[];
  user_count: number;
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get all roles and their permissions
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*')
    .returns<RoleRow[]>()

  if (rolesError || !roles) {
    return NextResponse.json({ error: rolesError?.message || 'Failed to fetch roles' }, { status: 500 })
  }

  // Get permissions
  const { data: permissions, error: permissionsError } = await supabase
    .from('permissions')
    .select('*')
    .returns<PermissionRow[]>()

  if (permissionsError || !permissions) {
    return NextResponse.json({ error: permissionsError?.message || 'Failed to fetch permissions' }, { status: 500 })
  }

  // Get role-permission mappings
  const { data: rolePermissions, error: rolePermissionsError } = await supabase
    .from('role_permissions')
    .select('*')
    .returns<RolePermissionRow[]>()

  if (rolePermissionsError || !rolePermissions) {
    return NextResponse.json({ error: rolePermissionsError?.message || 'Failed to fetch role permissions' }, { status: 500 })
  }

  // Get user-role mappings to count users per role
  const { data: userRoles, error: userRolesError } = await supabase
    .from('user_roles')
    .select('role_id, user_id')
    .returns<UserRoleRow[]>()

  if (userRolesError || !userRoles) {
    return NextResponse.json({ error: userRolesError?.message || 'Failed to fetch user roles' }, { status: 500 })
  }

  // Calculate user count per role
  const userCountPerRole: Record<string, number> = {};
  userRoles.forEach(ur => {
    userCountPerRole[ur.role_id] = (userCountPerRole[ur.role_id] || 0) + 1;
  });

  // Organize data
  const result = {
    roles: roles.map(role => {
      const rolePerms = rolePermissions
        .filter(rp => rp.role_id === role.id)
        .map(rp => rp.permission_id);
      
      return {
        ...role,
        permissions: rolePerms,
        user_count: userCountPerRole[role.id] || 0
      } as RoleWithPermissions;
    }),
    permissions
  };

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if user has admin permissions
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<UserRow>()

  if (userDataError || !userData || (userData.role !== 'admin' && userData.role !== 'LEAD_ADMIN')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body: CreateRoleRequest = await req.json()
  const { name, description, permissions } = body

  if (!name) {
    return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
  }

  // Create new role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert({
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single<RoleRow>()

  if (roleError || !role) {
    return NextResponse.json({ error: roleError?.message || 'Failed to create role' }, { status: 500 })
  }

  // Assign permissions to role
  if (permissions && permissions.length > 0) {
    const rolePermissionInserts = permissions.map((permissionId: string) => ({
      role_id: role.id,
      permission_id: permissionId
    }));

    const { error: rolePermissionError } = await supabase
      .from('role_permissions')
      .insert(rolePermissionInserts)

    if (rolePermissionError) {
      return NextResponse.json({ error: rolePermissionError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ 
    role: {
      ...role,
      permissions,
      user_count: 0
    } as RoleWithPermissions 
  }, { status: 201 })
}
