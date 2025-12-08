import { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { 
      status: 401, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  // Get all workflow rules
  const { data: workflowRules, error } = await supabase
    .from('workflow_rules')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  return new Response(JSON.stringify({ workflowRules }), { 
    headers: { 'content-type': 'application/json' } 
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { 
      status: 401, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  // Check if user has admin permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { 
      status: 403, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  const {
    name,
    description,
    fromStatus,
    toStatus,
    conditions,
    approvers,
    isActive
  } = await req.json()

  if (!name || !fromStatus || !toStatus) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
      status: 400, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  // Create new workflow rule
  const { data: workflowRule, error } = await supabase
    .from('workflow_rules')
    .insert({
      name,
      description,
      from_status: fromStatus,
      to_status: toStatus,
      conditions: JSON.stringify(conditions || []),
      approvers: JSON.stringify(approvers || []),
      is_active: isActive || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  // Transform the data to match the expected format
  const transformedRule = {
    ...workflowRule,
    fromStatus: workflowRule.from_status,
    toStatus: workflowRule.to_status,
    conditions: workflowRule.conditions ? JSON.parse(workflowRule.conditions) : [],
    approvers: workflowRule.approvers ? JSON.parse(workflowRule.approvers) : [],
    isActive: workflowRule.is_active,
    from_status: undefined,
    to_status: undefined,
    is_active: undefined
  }

  return new Response(JSON.stringify({ workflowRule: transformedRule }), { 
    status: 201, 
    headers: { 'content-type': 'application/json' } 
  })
}
