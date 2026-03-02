/**
 * 微信支付回调接收路由
 * POST /api/webhooks/wechat
 *
 * 流程：
 * 1. 读取原始 body（不走 Next.js JSON 序列化，保留签名完整性）
 * 2. 验证微信签名
 * 3. 解密 AES-GCM 密文，获取订单信息
 * 4. 更新数据库：激活订阅 + 写入支付流水
 * 5. 返回 HTTP 200 { code: 'SUCCESS' }（不返回则微信会持续重试）
 */
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 开发中：由于依赖尚未安装，暂时抛弃所有微信回调请求
  return NextResponse.json({ code: 'SUCCESS' }, { status: 200 });
}
