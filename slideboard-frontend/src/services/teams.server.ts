import { createClient } from '@/lib/supabase/server'

export async function getUserTeams() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    throw new Error('Not authenticated')
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
    throw new Error(error.message)
  }

  // Get members for each team
    const teamsWithMembers = await Promise.all(
        (teams || []).map(async (team: typeof teams[0]) => {
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

            const members = (membersData || []).map((member: typeof membersData[0]) => ({
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

  return teamsWithMembers
}

export async function getTeamById(teamId: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get team by ID where user is owner or member
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (
        count
      )
    `)
    .eq('id', teamId)
    .or(`owner_id.eq.${user.id},team_members.user_id.eq.${user.id}`)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!teams) {
    throw new Error('Team not found or access denied')
  }

  // Get members for the team
  const { data: membersData, error: membersError } = await supabase
    .from('team_members')
    .select(`
      *, 
      users (
        id,
        raw_user_meta_data
      )
    `)
    .eq('team_id', teamId)

  if (membersError) {
    throw membersError
  }

  const members = (membersData || []).map((member: typeof membersData[0]) => ({
    id: member.id,
    team_id: member.team_id,
    user_id: member.user_id,
    role: member.role,
    joined_at: member.joined_at,
    name: member.users?.raw_user_meta_data?.name || 'Unknown',
    avatar_url: member.users?.raw_user_meta_data?.avatar_url,
    is_online: false,
  }))

  return {
    ...teams,
    member_count: members.length,
    members,
  }
}
