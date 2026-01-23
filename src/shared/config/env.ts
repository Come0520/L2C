/**
 * L2C Environment Configuration
 */
import { z } from 'zod';

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DB_MAX_CONNECTIONS: z.coerce.number().int().positive().default(20),

    // App Info
    APP_NAME: z.string().default('L2C Sales Management'),
    APP_VERSION: z.string().default('0.1.0'),

    // Aliyun OSS
    OSS_REGION: z.string().default('oss-cn-hangzhou'),
    OSS_INTERNAL_ENDPOINT: z.string().optional(),
    OSS_ACCESS_KEY_ID: z.string().optional(),
    OSS_ACCESS_KEY_SECRET: z.string().optional(),
    OSS_BUCKET: z.string().default('l2c-uploads'),
    OSS_ROLE_ARN: z.string().optional(),

    // Aliyun SMS
    SMS_ACCESS_KEY_ID: z.string().optional(),
    SMS_ACCESS_KEY_SECRET: z.string().optional(),
    SMS_SIGN_NAME: z.string().optional(),
    SMS_TEMPLATE_CODE: z.string().optional(),

    // NextAuth
    AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
    AUTH_URL: z.string().url().default('http://localhost:3000'),

    // WeChat Mini Program (小程序)
    WX_APPID: z.string().optional(),           // 小程序 AppID
    WX_APPSECRET: z.string().optional(),       // 小程序 AppSecret
    WECHAT_MINI_APPID: z.string().optional(),  // 兼容旧字段
    WECHAT_MINI_SECRET: z.string().optional(), // 兼容旧字段

    // WeChat Mini Program 订阅消息模板
    WECHAT_TEMPLATE_TENANT_APPROVED: z.string().optional(),   // 租户审批通过模板
    WECHAT_TEMPLATE_TENANT_REJECTED: z.string().optional(),   // 租户审批拒绝模板
    WECHAT_TEMPLATE_ORDER_STATUS: z.string().optional(),      // 订单状态变更模板
    WECHAT_TEMPLATE_TASK_ASSIGN: z.string().optional(),       // 任务分配模板
});

const processEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_MAX_CONNECTIONS: process.env.DB_MAX_CONNECTIONS,
    APP_NAME: process.env.APP_NAME,
    APP_VERSION: process.env.APP_VERSION,
    OSS_REGION: process.env.OSS_REGION,
    OSS_INTERNAL_ENDPOINT: process.env.OSS_INTERNAL_ENDPOINT,
    OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID,
    OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET,
    OSS_BUCKET: process.env.OSS_BUCKET,
    OSS_ROLE_ARN: process.env.OSS_ROLE_ARN,
    SMS_ACCESS_KEY_ID: process.env.SMS_ACCESS_KEY_ID,
    SMS_ACCESS_KEY_SECRET: process.env.SMS_ACCESS_KEY_SECRET,
    SMS_SIGN_NAME: process.env.SMS_SIGN_NAME,
    SMS_TEMPLATE_CODE: process.env.SMS_TEMPLATE_CODE,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    WX_APPID: process.env.WX_APPID,
    WX_APPSECRET: process.env.WX_APPSECRET,
    WECHAT_MINI_APPID: process.env.WECHAT_MINI_APPID,
    WECHAT_MINI_SECRET: process.env.WECHAT_MINI_SECRET,
    WECHAT_TEMPLATE_TENANT_APPROVED: process.env.WECHAT_TEMPLATE_TENANT_APPROVED,
    WECHAT_TEMPLATE_TENANT_REJECTED: process.env.WECHAT_TEMPLATE_TENANT_REJECTED,
    WECHAT_TEMPLATE_ORDER_STATUS: process.env.WECHAT_TEMPLATE_ORDER_STATUS,
    WECHAT_TEMPLATE_TASK_ASSIGN: process.env.WECHAT_TEMPLATE_TASK_ASSIGN,
};

// Validate environment variables
const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
    // In development, strict validation might be annoying if .env is missing some non-critical ones.
    // But plan says "Strict Env Validation", typically we want to fail fast.
    // However, build process might fail if we are too strict on things not needed for build.
    // Generally usually fine to throw for required ones.
    // Make sure we don't crash the build if we are in a CI environment that sets vars differently or for simple checks.
    // But for now, adhering to the plan to ensure stability.
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
}

export const env = parsed.success ? parsed.data : (processEnv as any);
