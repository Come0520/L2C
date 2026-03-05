import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/shared/lib/auth';
import { approveRefundAndCreateReversal } from '@/features/finance/actions/refunds';

export async function POST(
  req: NextRequest,
  // Next 15+ Params are Promise based
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ success: false, message: '未授权或无权访问' }, { status: 401 });
    }

    const { id: refundId } = await params;

    if (!refundId) {
      return NextResponse.json({ success: false, message: '必须提供退款单号 ID' }, { status: 400 });
    }

    // 核心调用：更新退款状态、冲销对账单记录打点
    const res = await approveRefundAndCreateReversal(
      refundId,
      session.user.tenantId,
      session.user.id
    );

    return NextResponse.json(res, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/finance/refunds/[id]/approve] Error:', err);
    return NextResponse.json(
      { success: false, message: err.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}
