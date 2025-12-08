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

  // Check if user has admin permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin' && userData?.role !== 'LEAD_ADMIN') {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { 
      status: 403, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  // Get system configs
  const { data: configs, error } = await supabase
    .from('system_configs')
    .select('*')
    .order('category', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  return new Response(JSON.stringify({ configs }), { 
    headers: { 'content-type': 'application/json' } 
  })
}

export async function PUT(req: NextRequest) {
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

  if (userData?.role !== 'admin' && userData?.role !== 'LEAD_ADMIN') {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { 
      status: 403, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  const { id, value } = await req.json()

  if (!id || value === undefined) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
      status: 400, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  // Update system config
  const { data: config, error } = await supabase
    .from('system_configs')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  return new Response(JSON.stringify({ config }), { 
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

  if (userData?.role !== 'admin' && userData?.role !== 'LEAD_ADMIN') {
    return new Response(JSON.stringify({ error: 'Permission denied' }), { 
      status: 403, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  const { key, value, description, category } = await req.json()

  if (!key || !value || !category) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
      status: 400, 
      headers: { 'content-type': 'application/json' } 
    })
  }

  // Create new system config
  const { data: config, error } = await supabase
    .from('system_configs')
    .insert({
      key,
      value,
      description,
      category,
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

  return new Response(JSON.stringify({ config }), { 
    status: 201, 
    headers: { 'content-type': 'application/json' } 
  })
}
