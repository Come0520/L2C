/**
 * 租户支付配置 API
 *
 * GET /api/miniprogram/tenant/payment-config
 * POST /api/miniprogram/tenant/payment-config
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { jose } from 'jose'; // Wait, jose is usually imported as { jwtVerify } or similar. Checking usage.
import { jwtVerify } from 'jose';

// Helper: Verify Admin Role
// In a real app, middleware handles this. Here we verify manually.
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    // We need to check if user is admin.
    // Payload has userId. We fetch User -> Check Role.
    // Optimization: Payload SHOULD have role if we put it there.
    // Let's assume payload has userId and tenantId.

    // Fetch user role
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, payload.userId as string),
      columns: { role: true, tenantId: true },
    });

    if (user?.role === 'admin' || user?.role === 'BOSS') {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId!),
      columns: { settings: true },
    });

    const settings = (tenant?.settings as any) || {};
    const paymentConfig = settings.payment || {
      enabled: true,
      offline: {
        enabled: true,
        instructions: '',
      },
      online: {
        enabled: false,
      },
    };

    return NextResponse.json({ success: true, data: paymentConfig });
  } catch (error) {
    console.error('Get Payment Config Error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    // specific validation could go here

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId!),
      columns: { settings: true },
    });

    const currentSettings = (tenant?.settings as any) || {};
    const newSettings = {
      ...currentSettings,
      payment: body, // Overwrite payment section
    };

    await db
      .update(tenants)
      .set({ settings: newSettings, updatedAt: new Date() })
      .where(eq(tenants.id, user.tenantId!));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Payment Config Error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
