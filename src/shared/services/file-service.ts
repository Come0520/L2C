import OSS from 'ali-oss';
import { env } from '@/shared/config/env';

const region = env.OSS_REGION || 'oss-cn-hangzhou';
const normalizedRegion = region.startsWith('oss-') ? region : `oss-${region}`;
const internalEndpoint = env.OSS_INTERNAL_ENDPOINT || `${normalizedRegion}-internal.aliyuncs.com`;
const publicEndpoint = `${normalizedRegion}.aliyuncs.com`;

// 服务端使用的 Client 实例（懒加载）
let _serverClient: OSS | null = null;

function getServerClient(): OSS {
  if (!_serverClient) {
    if (!env.OSS_ACCESS_KEY_ID || !env.OSS_ACCESS_KEY_SECRET) {
      console.warn(
        '[OSS] Missing OSS_ACCESS_KEY_ID or OSS_ACCESS_KEY_SECRET. OSS client will not be initialized in build time.'
      );
    }
    _serverClient = new OSS({
      region: env.OSS_REGION,
      accessKeyId: env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: env.OSS_ACCESS_KEY_SECRET || '',
      bucket: env.OSS_BUCKET,
      endpoint: process.env.NODE_ENV === 'production' ? internalEndpoint : publicEndpoint,
      secure: true,
    });
  }
  return _serverClient;
}

export const fileService = {
  /**
   * 生成用于前端直传STS Token
   * 注意：需要主账号或RAM 用户有AliyunOSSFullAccess 或AssumeRole 权限
   */
  async getStsToken() {
    // 实际生产中应使用 RAM Role ARN 进行 AssumeRole
    // 这里简化为直接签名 URL 或临时凭证（如果使用 STS SDK）
    // 为了简化，这里演示生成带签名的 URL 和Policy (PostObject)

    // NOTE: 使用 STS SDK 获取临时 Token
    // 目前 ali-oss SDK 主要用于后端操作，获取STS 需要@alicloud/sts-sdk
    // 临时方案：返回签名供前端使用 (PutObject 签名 URL)

    // 如果必须实现 STS，建议引入@alicloud/sts-20150401
    // 这里暂时返回 mock 或null，待集成 STS SDK
    throw new Error('STS implementation requires @alicloud/sts-sdk');
  },

  /**
   * 生成带签名的上传 URL (当不使用STS 时的一种替代方案)
   * 有效期默认300s (5分钟)
   */
  async getSignatureUrl(objectName: string, method: 'PUT' | 'GET' = 'PUT') {
    return getServerClient().signatureUrl(objectName, {
      method,
      expires: 300,
    });
  },

  /**
   * 删除文件
   */
  async deleteFile(objectName: string) {
    try {
      await getServerClient().delete(objectName);
      return true;
    } catch (error) {
      console.error('OSS Delete Error:', error);
      return false;
    }
  },

  /**
   * 上传文件到 OSS
   * @param objectName OSS 对象名称 (路径+文件名)
   * @param buffer 文件二进制数据
   * @param options 上传选项
   */
  async uploadFile(objectName: string, buffer: Buffer, options?: OSS.PutObjectOptions) {
    try {
      const result = await getServerClient().put(objectName, buffer, options);
      return {
        success: true,
        url: this.getPublicUrl(result.name),
        name: result.name,
      };
    } catch (error) {
      console.error('OSS Upload Error:', error);
      return { success: false, error: '上传至 OSS 失败' };
    }
  },

  /**
   * 获取文件访问 URL
   */
  getPublicUrl(objectName: string) {
    // 强制使用公网域名
    return `https://${env.OSS_BUCKET}.${publicEndpoint}/${objectName}`;
  },
};
