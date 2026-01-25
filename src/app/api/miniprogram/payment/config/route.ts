/**
 * 支付配置查询 API (普通用户可用)
 *
 * GET /api/miniprogram/payment/config
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Helper to get tenantId from token
async function getTenantId(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.tenantId as string;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { settings: true },
    });

    const settings = (tenant?.settings as any) || {};
    const paymentConfig = settings.payment || {
      enabled: true,
      offline: { enabled: true, instructions: '' },
      online: { enabled: false },
    };

    return NextResponse.json({ success: true, data: paymentConfig });
  } catch (error) {
    console.error('Get Payment Config Error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
