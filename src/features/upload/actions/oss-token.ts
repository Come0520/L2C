'use server';

import { unstable_cache } from 'next/cache';

// import { logger } from '@/shared/lib/logger'; // OSS 功能禁用时，logger 暂不使用
// import { env } from '@/shared/config/env'; // OSS 功能暂时禁用


/**
 * 阿里云 OSS STS 临时凭证响应数据结构
 *
 * @remarks 用于客户端直传 OSS 时的身份验证，凭证由服务端通过 STS AssumeRole 获取
 */
interface OSSTokenData {
    /** STS 临时 AccessKey ID */
    AccessKeyId: string;
    /** STS 临时 AccessKey Secret */
    AccessKeySecret: string;
    /** STS 安全令牌 (Security Token) */
    SecurityToken: string;
    /** 凭证过期时间（ISO 8601 格式） */
    Expiration: string;
    /** OSS Bucket 名称 */
    bucket: string;
    /** OSS 地域标识（如 'oss-cn-hangzhou'） */
    region: string;
}

/**
 * 【内部】获取阿里云 OSS STS 临时授权 Token（未缓存版本）
 */
async function getOSSTokenBase(): Promise<{ success: true; data: OSSTokenData } | { success: false; error: string }> {
    return { success: false, error: 'OSS Upload temporarily disabled for update' };
    /*
    try {
        if (!env.OSS_ACCESS_KEY_ID || !env.OSS_ACCESS_KEY_SECRET || !env.OSS_ROLE_ARN) {
            logger.error('Missing Aliyun configuration');
            return { success: false, error: 'Server configuration error' };
        }

        const sts = new OSS.STS({
            accessKeyId: env.OSS_ACCESS_KEY_ID,
            accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
        });

        // 获取 15 分钟临时凭证
        const result = await sts.assumeRole(
            env.OSS_ROLE_ARN,
            '',
            900,
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
        logger.error('STS Token Error:', error);
        return { success: false, error: 'Failed to generate STS token' };
    }
    */
}

/**
 * 获取阿里云 OSS STS 临时授权 Token（带短时缓存策略）
 *
 * @remarks
 * - 基于 `next/cache` 的 `unstable_cache` 实现结果缓存，减少对阿里云 STS 服务的高频 API 请求。
 * - STS 凭证默认过期时间为 15 分钟（900 秒），此处缓存设定为 14 分钟（840 秒），提前 1 分钟刷新缓存节点以防止凭证边缘过期。
 * - 该方法主要可提供直传需要的凭证安全发放。
 * - 当前状态：**暂时禁用**，待 OSS 环境配置就绪后启用
 *
 * @returns `{ success: true, data: OSSTokenData }` 成功时返回 STS 凭证
 * @returns `{ success: false, error: string }` 失败或功能禁用时返回错误信息
 *
 * @example
 * ```ts
 * const result = await getOSSToken();
 * if (result.success) {
 *   // 缓存命中的结果可用于初始化 OSS 客户端
 * }
 * ```
 */
export const getOSSToken = unstable_cache(
    async () => getOSSTokenBase(),
    ['oss-sts-token'],
    {
        revalidate: 840, // 缓存 14 分钟 (OSS 凭证有效 15分，提前 1分钟刷新)
        tags: ['oss-sts'],
    }
);
