/**
 * L2C Environment Configuration
 */
export const env = {
    // Database
    DATABASE_URL: process.env.DATABASE_URL || '',

    // App Info
    APP_NAME: 'L2C Sales Management',
    APP_VERSION: '0.1.0',

    // Aliyun OSS
    OSS_REGION: process.env.OSS_REGION || 'oss-cn-hangzhou',
    OSS_INTERNAL_ENDPOINT: process.env.OSS_INTERNAL_ENDPOINT,
    OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID || '',
    OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET || '',
    OSS_BUCKET: process.env.OSS_BUCKET || 'l2c-uploads',

    // Aliyun SMS
    SMS_ACCESS_KEY_ID: process.env.SMS_ACCESS_KEY_ID || '',
    SMS_ACCESS_KEY_SECRET: process.env.SMS_ACCESS_KEY_SECRET || '',
    SMS_SIGN_NAME: process.env.SMS_SIGN_NAME || '',
    SMS_TEMPLATE_CODE: process.env.SMS_TEMPLATE_CODE || '',

    // NextAuth
    AUTH_SECRET: process.env.AUTH_SECRET || 'secret',
    AUTH_URL: process.env.AUTH_URL || 'http://localhost:3000',
};
