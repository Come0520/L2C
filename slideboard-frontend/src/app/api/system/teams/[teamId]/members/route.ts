import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// Define request body types
interface CreateTeamMemberRequest {
  phone: string;
  role?: string;
}

interface DeleteTeamMemberRequest {
  memberId: string;
}

interface UpdateTeamMemberRequest {
  memberId: string;
  role: 'member' | 'admin';
}

// Define database row types
interface UserRow {
  id: string;
  raw_user_meta_data: {
    name?: string;
    avatar_url?: string;
    phone?: string;
  };
}

interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
  users?: UserRow;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  const resolvedParams = await params
  const { teamId } = resolvedParams

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, {
      status: 401
    })
  }

  const body: CreateTeamMemberRequest = await req.json()
  const { phone, role } = body

  if (!phone) {
    return NextResponse.json({ error: 'Phone is required' }, {
      status: 400
    })
  }

  // Find user by phone in metadata
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, raw_user_meta_data')
    .eq('raw_user_meta_data->>phone', phone)
    .single<UserRow>()

  if (userError || !users) {
    return NextResponse.json({ error: 'User not found with this phone' }, {
      status: 404
    })
  }

  // Add member to team
  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: users.id,
      role: role || 'member',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: 'User is already a member of this team' }, {
        status: 400
      })
    }
    return NextResponse.json({ error: error.message }, {
      status: 500
    })
  }

  // Get full member data
  const { data: membersData } = await supabase
    .from('team_members')
    .select(`
      *,
      users (
        id,
        raw_user_meta_data
      )
    `)
    .eq('team_id', teamId)
    .eq('user_id', users.id)
    .single<TeamMemberRow>()

  if (!membersData) {
    return NextResponse.json({ error: 'Failed to retrieve member data' }, {
      status: 500
    })
  }

  const newMember = {
    id: membersData.id,
    team_id: membersData.team_id,
    user_id: membersData.user_id,
    role: membersData.role,
    joined_at: membersData.joined_at,
    name: membersData.users?.raw_user_meta_data?.name || 'Unknown',
    avatar_url: membersData.users?.raw_user_meta_data?.avatar_url,
    is_online: false,
  }

  return NextResponse.json({ member: newMember }, {
    status: 201
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  const resolvedParams = await params
  const { teamId } = resolvedParams

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, {
      status: 401
    })
  }

  const body: DeleteTeamMemberRequest = await req.json()
  const { memberId } = body

  if (!memberId) {
    return NextResponse.json({ error: 'Member ID is required' }, {
      status: 400
    })
  }

  // Remove member from team
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, {
      status: 500
    })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  const resolvedParams = await params
  const { teamId } = resolvedParams

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, {
      status: 401
    })
  }

  const body: UpdateTeamMemberRequest = await req.json()
  const { memberId, role } = body

  if (!memberId || !role) {
    return NextResponse.json({ error: 'Member ID and role are required' }, {
      status: 400
    })
  }

  if (role !== 'member' && role !== 'admin') {
    return NextResponse.json({ error: 'Invalid role' }, {
      status: 400
    })
  }

  // Update member role
  const { error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, {
      status: 500
    })
  }

  // Get updated member data
  const { data: membersData } = await supabase
    .from('team_members')
    .select(`
      *,
      users (
        id,
        raw_user_meta_data
      )
    `)
    .eq('team_id', teamId)
    .eq('user_id', memberId)
    .single<TeamMemberRow>()

  if (!membersData) {
    return NextResponse.json({ error: 'Failed to retrieve member data' }, {
      status: 500
    })
  }

  const updatedMember = {
    id: membersData.id,
    team_id: membersData.team_id,
    user_id: membersData.user_id,
    role: membersData.role,
    joined_at: membersData.joined_at,
    name: membersData.users?.raw_user_meta_data?.name || 'Unknown',
    avatar_url: membersData.users?.raw_user_meta_data?.avatar_url,
    is_online: false,
  }

  return NextResponse.json({ member: updatedMember })
}
