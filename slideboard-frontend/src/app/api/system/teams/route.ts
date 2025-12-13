import { NextRequest, NextResponse } from 'next/server'
import z from 'zod'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { 
      status: 401 
    })
  }

  // Get teams where user is owner or member
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (
        count
      )
    `)
    .or(`owner_id.eq.${user.id},team_members.user_id.eq.${user.id}`)

  if (error) {
    return NextResponse.json({ error: error.message }, { 
      status: 500 
    })
  }

  // Get members for each team
  const teamsWithMembers = await Promise.all(
    (teams || []).map(async (team: any) => {
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          users (
            id,
            raw_user_meta_data
          )
        `)
        .eq('team_id', team.id)

      if (membersError) {
        throw membersError
      }

      const members = (membersData || []).map((member: any) => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        name: member.users?.raw_user_meta_data?.name || 'Unknown',
        avatar_url: member.users?.raw_user_meta_data?.avatar_url,
        is_online: false, // Would need real-time presence tracking
      }))

      return {
        ...team,
        member_count: members.length,
        members,
      }
    })
  )

  return NextResponse.json({ teams: teamsWithMembers })
}

// Define Zod schema for team creation
export const teamSchema = z.object({
  name: z.string().min(1, '团队名称不能为空').max(50, '团队名称不能超过50个字符'),
  description: z.string().max(200, '团队描述不能超过200个字符').optional()
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { 
      status: 401 
    })
  }

  try {
    const body = await req.json()
    const validatedData = teamSchema.parse(body)
    
    const { name, description } = validatedData

  // Create new team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name,
      description,
      owner_id: user.id,
    })
    .select()
    .single()

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { 
      status: 500 
    })
  }

  // Add creator as admin member
  await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'admin',
    })

  // Get members for the new team
  const { data: membersData } = await supabase
    .from('team_members')
    .select(`
      *,
      users (
        id,
        raw_user_meta_data
      )
    `)
    .eq('team_id', team.id)

  const members = (membersData || []).map((member: any) => ({
    id: member.id,
    team_id: member.team_id,
    user_id: member.user_id,
    role: member.role,
    joined_at: member.joined_at,
    name: member.users?.raw_user_meta_data?.name || 'Unknown',
    avatar_url: member.users?.raw_user_meta_data?.avatar_url,
    is_online: false,
  }))

  return NextResponse.json({
    team: {
      ...team,
      member_count: members.length,
      members,
    }
  }, { 
    status: 201 
  })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { 
        status: 400 
      })
    }
    return NextResponse.json({ error: 'Failed to create team' }, { 
      status: 500 
    })
  }
}
