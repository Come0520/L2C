import { createServerClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { env } from '@/config/env'
import { Database } from '@/types/supabase'

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()


  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'lax',
              })
            )
          } catch {
          }
        },
      },
    }
  )
}
