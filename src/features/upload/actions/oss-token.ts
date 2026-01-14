'use server';

import OSS from 'ali-oss';
import { env } from '@/shared/config/env';

/**
 * 获取 OSS STS 临时授权 Token
 * 有效期：15分钟 (900秒，阿里�?STS 最小�?
 */
export async function getOssStsToken() {
    try {
        if (!env.ALIYUN_ROLE_ARN) {
            console.warn('ALIYUN_ROLE_ARN is not set. STS token generation will fail.');
            return { success: false, error: 'ALIYUN_ROLE_ARN is missing' };
        }

        // Initialize STS client from ali-oss
        // Note: ali-oss exports STS as a property
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const STS = (OSS as any).STS;

        if (!STS) {
            throw new Error('ALI-OSS STS client not found');
        }

        const client = new STS({
            accessKeyId: env.OSS_ACCESS_KEY_ID!,
            accessKeySecret: env.OSS_ACCESS_KEY_SECRET!
        });

        const roleArn = env.ALIYUN_ROLE_ARN;
        const sessionName = 'L2C_App_Session';
        const durationSeconds = 900; // 15 minutes

        // AssumeRole 
        const result = await client.assumeRole(roleArn, '', durationSeconds, sessionName);

        // result.credentials contains AccessKeyId, AccessKeySecret, SecurityToken, Expiration
        if (result && result.credentials) {
            return {
                success: true,
                data: {
                    accessKeyId: result.credentials.AccessKeyId,
                    accessKeySecret: result.credentials.AccessKeySecret,
                    securityToken: result.credentials.SecurityToken,
                    expiration: result.credentials.Expiration,
                }
            };
        }

        return { success: false, error: 'Failed to retrieve credentials from STS' };

    } catch (error) {
        console.error('STS Token Error:', error);
        return { success: false, error: 'Failed to generate STS token' };
    }
}
