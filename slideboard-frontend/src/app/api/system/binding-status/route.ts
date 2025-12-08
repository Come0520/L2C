import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return NextResponse.json({ matchedByUid: false, matchedByEmail: false, userId: null })
  }

  const { data: installerByUid } = await supabase
    .from('installers')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  let matchedByEmail = false
  if (user.email) {
    const { data: installerByEmail } = await supabase
      .from('installers')
      .select('id')
      .eq('email', user.email)
      .limit(1)
    matchedByEmail = !!(installerByEmail && installerByEmail.length > 0)
  }

  const matchedByUid = !!(installerByUid && installerByUid.length > 0)

  return NextResponse.json({ matchedByUid, matchedByEmail, userId: user.id })
}
