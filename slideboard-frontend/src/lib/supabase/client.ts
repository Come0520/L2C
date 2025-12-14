import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/config/env'
import { Database } from '@/types/supabase'

// Cookie 安全配置
const cookieOptions = {
  secure: env.NODE_ENV === 'production', // 生产环境下使用 Secure 属性
  httpOnly: true, // 防止 XSS 攻击
  sameSite: 'lax' as const, // 防止 CSRF 攻击，允许 OAuth 重定向
  maxAge: 60 * 60 * 24 * 7, // Cookie 有效期 7 天
}

// 创建并导出 supabase 实例
export const supabase = createBrowserClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
    },
    // Cookie 安全配置在顶层
    cookieOptions,
  }
)

// 保留 createClient 函数，以便需要时可以创建新实例
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
      },
      // Cookie 安全配置在顶层
      cookieOptions,
    }
  )
}
