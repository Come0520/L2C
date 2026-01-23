'use server';

// import { env } from '@/shared/config/env'; // OSS 功能暂时禁用


/**
 * OSS STS Token 响应数据
 */
interface OSSTokenData {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
    Expiration: string;
    bucket: string;
    region: string;
}

/**
 * 获取 OSS STS 临时授权 Token
 * 有效期：15分钟 (900秒，阿里云 STS 最小值)
 */
export async function getOSSToken(): Promise<{ success: true; data: OSSTokenData } | { success: false; error: string }> {
    return { success: false, error: 'OSS Upload temporarily disabled for update' };
    /*
    try {
        if (!env.OSS_ACCESS_KEY_ID || !env.OSS_ACCESS_KEY_SECRET || !env.OSS_ROLE_ARN) {
            console.error('Missing Aliyun configuration');
            return { success: false, error: 'Server configuration error' };
        }

        const sts = new OSS.STS({
            accessKeyId: env.OSS_ACCESS_KEY_ID,
            accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
        });

        const result = await sts.assumeRole(
            env.OSS_ROLE_ARN,
            '',
            3000,
            'session-name'
        );

        if (result && result.credentials) {
            return {
                success: true,
                data: {
                    AccessKeyId: result.credentials.AccessKeyId,
                    AccessKeySecret: result.credentials.AccessKeySecret,
                    SecurityToken: result.credentials.SecurityToken,
                    Expiration: result.credentials.Expiration,
                    bucket: env.OSS_BUCKET,
                    region: env.OSS_REGION,
                }
            };
        }

        return { success: false, error: 'Failed to obtain credentials' };

    } catch (error) {
        console.error('STS Token Error:', error);
        return { success: false, error: 'Failed to generate STS token' };
    }
    */
}
