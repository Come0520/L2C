/**
 * 支付宝回调接收路由
 * POST /api/webhooks/alipay
 *
 * 流程：
 * 1. 解析 form-urlencoded body（支付宝默认格式）
 * 2. 验证 RSA2 签名
 * 3. 检查 trade_status === 'TRADE_SUCCESS'
 * 4. 激活订阅 + 写入支付流水
 * 5. 返回纯文本 "success"（支付宝要求）
 */
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 开发中：由于依赖尚未安装，暂时抛弃所有支付宝回调请求
  return new NextResponse('success', { status: 200, headers: { 'Content-Type': 'text/plain' } });
}
