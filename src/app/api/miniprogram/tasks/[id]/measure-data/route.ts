import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, measureItems } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { z } from 'zod';

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

// 数据验证 Schema
const measureDataSchema = z.object({
  round: z.number().int().positive(),
  variant: z.string().min(1),
  sitePhotos: z.array(z.string()).optional(),
  items: z.array(
    z.object({
      roomName: z.string().min(1),
      windowType: z.enum(['STRAIGHT', 'L_SHAPE', 'U_SHAPE', 'ARC']),
      width: z.number().positive(),
      height: z.number().positive(),
      installType: z.enum(['TOP', 'SIDE']).optional(),
      bracketDist: z.number().optional(),
      wallMaterial: z.enum(['CONCRETE', 'WOOD', 'GYPSUM']).optional(),
      hasBox: z.boolean().optional(),
      boxDepth: z.number().optional(),
      isElectric: z.boolean().optional(),
      remark: z.string().optional(),
    })
  ),
});

/**
 * POST /api/miniprogram/tasks/[id]/measure-data
 * 提交测量数据
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 数据验证
    const validationResult = measureDataSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '数据格式错误', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

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

    // 权限校验：只有被指派的工人可以提交
    if (t.assignedWorkerId !== user.id) {
      return NextResponse.json(
        { success: false, error: '只有被指派的工人可以提交测量数据' },
        { status: 403 }
      );
    }

    // 在事务中创建测量单和明细
    const result = await db.transaction(async (tx) => {
      // 1. 创建测量单
      const [sheet] = await tx
        .insert(measureSheets)
        .values({
          tenantId: user.tenantId,
          taskId: id,
          round: data.round,
          variant: data.variant,
          sitePhotos: data.sitePhotos || [],
          status: 'CONFIRMED', // 提交即为确认（师傅端逻辑）
        })
        .returning();

      // 2. 批量插入测量明细
      if (data.items.length > 0) {
        await tx.insert(measureItems).values(
          data.items.map((item) => ({
            tenantId: user.tenantId,
            sheetId: sheet.id,
            roomName: item.roomName,
            windowType: item.windowType,
            width: item.width.toString(),
            height: item.height.toString(),
            installType: item.installType,
            bracketDist: item.bracketDist?.toString(),
            wallMaterial: item.wallMaterial,
            hasBox: item.hasBox || false,
            boxDepth: item.boxDepth?.toString(),
            isElectric: item.isElectric || false,
            remark: item.remark,
          }))
        );
      }

      // 3. 更新任务状态为待确认
      await tx
        .update(measureTasks)
        .set({
          status: 'PENDING_CONFIRM',
          updatedAt: new Date(),
        })
        .where(eq(measureTasks.id, id));

      return sheet;
    });

    return NextResponse.json({
      success: true,
      message: '提交成功',
      data: { sheetId: result.id },
    });
  } catch (error: any) {
    console.error('[POST /api/miniprogram/tasks/[id]/measure-data] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
