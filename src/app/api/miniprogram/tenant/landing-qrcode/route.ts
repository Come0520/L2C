import { NextRequest, NextResponse } from 'next/server';
import { apiBadRequest, apiServerError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';

/**
 * 生成租户落地页推广小程序码
 * GET /api/miniprogram/tenant/landing-qrcode?code=xxxxxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return apiBadRequest('缺少 scene 或 envVersion 参数', {
        cause: 'invalid_params',
      });
    }

    const appId = process.env.WX_APPID || process.env.WECHAT_MINI_APPID;
    const appSecret = process.env.WX_APPSECRET || process.env.WECHAT_MINI_SECRET;

    if (!appId || !appSecret) {
      logger.error('未配置小程序 AppID 或 AppSecret');
      return apiServerError('服务端未配置小程序信息');
    }

    // 1. 获取 Access Token
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.errcode || !tokenData.access_token) {
      logger.error('获取 Access Token 失败:', tokenData);
      return apiServerError('获取微信 Access Token 失败', tokenData);
    }

    const accessToken = tokenData.access_token;

    // 2. 生成小程序码
    // 文档: https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/qrcode-link/qr-code/getUnlimitedQRCode.html
    const qrRes = await fetch(
      `https://api.weixin.qq.com/wxa/getwxacodeunlimited?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene: `tc=${code}`, // 使用拼接参数，因为只能传最多32个字符
          page: 'pages/landing/index',
          check_path: false,
          env_version: process.env.NODE_ENV === 'production' ? 'release' : 'trial',
          width: 430,
        }),
      }
    );

    const contentType = qrRes.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const errorData = await qrRes.json();
      logger.error('生成小程序码失败:', errorData);
      return apiServerError('获取着陆页分享码异常', {
        cause: errorData,
      });
    }

    const imageBuffer = await qrRes.arrayBuffer();

    // 3. 返回图片
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    logger.error('处理小程序码请求错误:', error);
    return apiServerError('内部服务器错误');
  }
}
