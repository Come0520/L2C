import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

/**
 * Helper: Parse User from Token
 */
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.userId as string,
      tenantId: payload.tenantId as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * POST /api/miniprogram/tasks/[id]/check-in
 * GPS 签到
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { latitude, longitude, accuracy } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ success: false, error: '缺少位置信息' }, { status: 400 });
    }

    // 查询任务
    const task = await db
      .select()
      .from(measureTasks)
      .where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId)))
      .limit(1);

    if (!task.length) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    }

    const t = task[0];

    // 权限校验：只有被指派的工人可以签到
    if (t.assignedWorkerId !== user.id) {
      return NextResponse.json(
        { success: false, error: '只有被指派的工人可以签到' },
        { status: 403 }
      );
    }

    // 状态校验：必须是待上门状态
    if (t.status !== 'PENDING_VISIT') {
      return NextResponse.json({ success: false, error: '当前状态不允许签到' }, { status: 400 });
    }

    // 更新签到信息
    await db
      .update(measureTasks)
      .set({
        checkInAt: new Date(),
        checkInLocation: { latitude, longitude, accuracy },
        updatedAt: new Date(),
      })
      .where(eq(measureTasks.id, id));

    return NextResponse.json({
      success: true,
      message: '签到成功',
    });
  } catch (error: any) {
    console.error('[POST /api/miniprogram/tasks/[id]/check-in] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
