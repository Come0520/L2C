import { z } from 'zod'

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_NAME: z.string().optional().default('L2C'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_E2E_TEST: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const serverSchema = z.object({
  FEISHU_APP_ID: z.string().optional(),
  FEISHU_APP_SECRET: z.string().optional(),
  FEISHU_WEBHOOK_URL: z.string().url().optional(),
  WECHAT_APP_ID: z.string().optional(),
  WECHAT_APP_SECRET: z.string().optional(),
  WECHAT_WEBHOOK_URL: z.string().url().optional(),
  FEISHU_BUSINESS_DATA_APP_TOKEN: z.string().optional(),
  FEISHU_BUSINESS_DATA_TABLE_ID: z.string().optional(),
  FEISHU_ACCESS_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  CDN_URL: z.string().optional(),
})

const _clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_E2E_TEST: process.env.NEXT_PUBLIC_E2E_TEST,
  NODE_ENV: process.env.NODE_ENV,
})

if (!_clientEnv.success) {
  console.error('❌ Invalid environment variables:', _clientEnv.error.format())
  throw new Error('Invalid environment variables')
}

// Server-side environment variables
// Note: We manually map these to ensure we don't accidentally leak process.env to client
// if this file is imported there. However, checking `typeof window` is a safeguard.
const _serverEnv = typeof window === 'undefined' ? serverSchema.safeParse({
  FEISHU_APP_ID: process.env.FEISHU_APP_ID,
  FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET,
  FEISHU_WEBHOOK_URL: process.env.FEISHU_WEBHOOK_URL,
  WECHAT_APP_ID: process.env.WECHAT_APP_ID,
  WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET,
  WECHAT_WEBHOOK_URL: process.env.WECHAT_WEBHOOK_URL,
  FEISHU_BUSINESS_DATA_APP_TOKEN: process.env.FEISHU_BUSINESS_DATA_APP_TOKEN,
  FEISHU_BUSINESS_DATA_TABLE_ID: process.env.FEISHU_BUSINESS_DATA_TABLE_ID,
  FEISHU_ACCESS_TOKEN: process.env.FEISHU_ACCESS_TOKEN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  CDN_URL: process.env.CDN_URL,
}) : { success: true, data: {} } as const;

if (!_serverEnv.success) {
  console.error('❌ Invalid server environment variables:', _serverEnv.error.format())
  // We might not want to throw here if some server vars are optional
}

export const env = {
  ..._clientEnv.data,
  ...(_serverEnv.success ? _serverEnv.data : {}),
} as z.infer<typeof clientSchema> & Partial<z.infer<typeof serverSchema>>
