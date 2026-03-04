import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiNotFound,
  apiForbidden,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, measureItems } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { withMiniprogramAuth } from '../../../auth-utils';
import { z } from 'zod';

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

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await request.json();

      // 数据验证
      const validationResult = measureDataSchema.safeParse(body);
      if (!validationResult.success) {
        return apiBadRequest('数据格式错误');
      }

      const data = validationResult.data;

      // 查询任务
      const task = await db
        .select()
        .from(measureTasks)
        .where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId)))
        .limit(1);

      if (!task.length) {
        return apiNotFound('任务不存在');
      }

      const t = task[0];

      // 权限校验：只有被指派的工人可以提交
      if (t.assignedWorkerId !== user.id) {
        return apiForbidden('只有被指派的工人可以提交测量数据');
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
            status: 'DRAFT', // 改为 DRAFT，进入审核流
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
          .where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId)));

        return sheet;
      });

      return apiSuccess({ sheetId: result.id });
    } catch (error: unknown) {
      logger.error('[POST /api/miniprogram/tasks/[id]/measure-data] Error:', error);
      const message = error instanceof Error ? error.message : '服务器错误';
      return apiServerError(message);
    }
  },
  ['WORKER', 'SALES', 'MANAGER', 'ADMIN']
);
