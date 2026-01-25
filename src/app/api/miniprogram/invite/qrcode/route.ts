/**
 * 生成邀请小程序码
 * GET /api/miniprogram/invite/qrcode?code=xxxxxx
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: '缺少邀请码' }, { status: 400 });
    }

    const appId = process.env.WX_APPID || process.env.WECHAT_MINI_APPID;
    const appSecret = process.env.WX_APPSECRET || process.env.WECHAT_MINI_SECRET;

    // 如果没有配置小程序信息，返回一个占位图或错误（暂且返回 404 以便调试）
    if (!appId || !appSecret) {
      console.error('未配置小程序 AppID 或 AppSecret');
      return NextResponse.json(
        { success: false, error: '服务端未配置小程序信息' },
        { status: 500 }
      );
    }

    // 1. 获取 Access Token
    // 注意：生产环境应缓存 Access Token，避免频繁调用触发限制
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.errcode || !tokenData.access_token) {
      console.error('获取 Access Token 失败:', tokenData);
      return NextResponse.json(
        { success: false, error: '获取微信 Access Token 失败', detail: tokenData },
        { status: 500 }
      );
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
      console.error('生成小程序码失败:', errorData);
      return NextResponse.json(
        { success: false, error: '生成小程序码失败', detail: errorData },
        { status: 500 }
      );
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
    console.error('处理小程序码请求错误:', error);
    return NextResponse.json({ success: false, error: '内部服务器错误' }, { status: 500 });
  }
}
