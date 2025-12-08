import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return NextResponse.json({ success: false })
  }

  return NextResponse.json({ success: true, userId: user.id })
}
