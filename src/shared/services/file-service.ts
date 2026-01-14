import OSS from 'ali-oss';
import { env } from '@/shared/config/env';

// 区分内外�?Endpoint
const internalEndpoint = env.OSS_INTERNAL_ENDPOINT || `oss-${env.OSS_REGION}-internal.aliyuncs.com`;
const publicEndpoint = `oss-${env.OSS_REGION}.aliyuncs.com`;

// 服务端使用的 Client (优先走内�?
const serverClient = new OSS({
    region: env.OSS_REGION,
    accessKeyId: env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET || '',
    bucket: env.OSS_BUCKET,
    endpoint: process.env.NODE_ENV === 'production' ? internalEndpoint : publicEndpoint,
    secure: true,
});

export const fileService = {
    /**
     * 生成用于前端直传�?STS Token
     * 注意：需要主账号�?RAM 用户�?AliyunOSSFullAccess �?AssumeRole 权限
     */
    async getStsToken() {
        // 实际生产中应使用 RAM Role ARN 进行 AssumeRole
        // 这里简化为直接签名 URL 或临时凭证（如果使用 STS SDK�?
        // 为了简化，这里演示生成带签名的 URL �?Policy (PostObject)

        // TODO: 使用 STS SDK 获取临时 Token
        // 目前 ali-oss SDK 主要用于后端操作，获�?STS 需�?@alicloud/sts-sdk
        // 临时方案：返回签名供前端使用 (PutObject 签名 URL)

        // 如果必须实现 STS，建议引�?@alicloud/sts-20150401
        // 这里暂时返回 mock �?null，待集成 STS SDK
        throw new Error('STS implementation requires @alicloud/sts-sdk');
    },

    /**
     * 生成带签名的上传 URL (当不�?STS 时的一种替代方�?
     * 有效期默�?300s (5分钟)
     */
    async getSignatureUrl(objectName: string, method: 'PUT' | 'GET' = 'PUT') {
        return serverClient.signatureUrl(objectName, {
            method,
            expires: 300,
        });
    },

    /**
     * 删除文件
     */
    async deleteFile(objectName: string) {
        try {
            await serverClient.delete(objectName);
            return true;
        } catch (error) {
            console.error('OSS Delete Error:', error);
            return false;
        }
    },

    /**
     * 获取文件访问 URL
     */
    getPublicUrl(objectName: string) {
        // 强制使用公网域名
        return `https://${env.OSS_BUCKET}.${publicEndpoint}/${objectName}`;
    }
};
