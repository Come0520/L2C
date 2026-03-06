import { NextResponse } from 'next/server';
import { auth } from '@/shared/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      userId: session?.user?.id,
      tenantId: session?.user?.tenantId,
      session,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
