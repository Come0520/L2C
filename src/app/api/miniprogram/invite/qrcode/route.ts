/**
 * 生成邀请小程序码
 * GET /api/miniprogram/invite/qrcode?code=xxxxxx
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return apiError('缺少邀请码', 400);
    }

    const appId = process.env.WX_APPID || process.env.WECHAT_MINI_APPID;
    const appSecret = process.env.WX_APPSECRET || process.env.WECHAT_MINI_SECRET;

    // 如果没有配置小程序信息，返回一个占位图或错误（暂且返回 404 以便调试）
    if (!appId || !appSecret) {
      logger.error('未配置小程序 AppID 或 AppSecret');
      return apiError('服务端未配置小程序信息', 500);
    }

    // 1. 获取 Access Token
    // 注意：生产环境应缓存 Access Token，避免频繁调用触发限制
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.errcode || !tokenData.access_token) {
      logger.error('获取 Access Token 失败:', tokenData);
      return apiError('获取微信 Access Token 失败', 500, tokenData);
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
          scene: code,
          page: 'pages/invite/invite', // 跳转的小程序页面
          check_path: false, // 开发/测试阶段设为 false，否则必须发布后才能生成
          env_version: process.env.NODE_ENV === 'production' ? 'release' : 'trial', // trial: 体验版, develop: 开发版
          width: 430,
        }),
      }
    );

    // 微信 API 如果出错，会返回 JSON，否则返回图片 Buffer
    const contentType = qrRes.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const errorData = await qrRes.json();
      logger.error('生成小程序码失败:', errorData);
      return apiError('生成小程序码失败', 500, errorData);
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
    return apiError('内部服务器错误', 500);
  }
}
