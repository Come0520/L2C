/**
 * 调度模块 - 核心 Server Actions
 *
 * 提供测量任务和安装任务的调度操作能力，包括工人指派和任务状态流转。
 * 所有操作均强制执行多租户隔离和操作审计日志记录。
 *
 * @module dispatch-actions
 */
'use server';

import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema/service';
import { users } from '@/shared/api/schema/infrastructure';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * 审计上下文接口
 *
 * 用于封装当前操作者的身份、来源等信息，传递给审计服务进行操作日志记录。
 * 在调度模块中，每次指派工人或更新任务状态时都会构建此上下文。
 *
 * @property userId - 当前操作者的用户 ID
 * @property tenantId - 当前操作者所属的租户 ID（用于多租户隔离）
 * @property ip - 请求来源 IP 地址
 * @property userAgent - 请求来源的用户代理标识
 * @property path - 请求的路由路径
 */

// ============================================================================
// MEASURE TASKS (测量任务调度)
// ============================================================================

/**
 * 指派测量工人到指定的测量任务
 *
 * 安全加固：执行前会验证会话身份、工人租户归属和任务存在性。
 * 操作流程：
 * 1. 校验当前用户会话是否有效
 * 2. 验证目标工人是否属于当前租户（防止跨租户越权）
 * 3. 更新测量任务的指派工人并将状态设为「调度中」
 * 4. 记录操作审计日志
 * 5. 刷新调度页面缓存
 *
 * @param taskId - 测量任务 ID
 * @param workerId - 待指派的工人用户 ID
 * @returns 包含 success 状态和 taskId 的操作结果
 * @throws {Error} 当用户未授权（未登录或无租户信息）时抛出
 * @throws {Error} 当目标工人不存在或不属于当前租户时抛出
 * @throws {Error} 当测量任务不存在或无权限修改时抛出
 */
export async function assignMeasureWorker(taskId: string, workerId: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    logger.warn('[Dispatch] 未授权尝试指派测量工人', { taskId, workerId });
    throw new Error('未授权访问');
  }

  const { tenantId, id: currentUserId } = session.user;
  logger.info('[Dispatch] 开始指派测量工人', {
    taskId,
    workerId,
    tenantId,
    operatorId: currentUserId,
  });

  try {
    return await db.transaction(async (tx) => {
      // 1. 验证工人是否属于本租户
      const workerExists = await tx.query.users.findFirst({
        where: and(eq(users.id, workerId), eq(users.tenantId, tenantId)),
      });

      if (!workerExists) {
        logger.warn('[Dispatch] 指派失败：目标工人不存在或跨租户', { taskId, workerId, tenantId });
        throw new Error('目标工人不存在或不属于当前租户');
      }

      // 2. 更新任务，强制带上 tenantId 隔离
      const [updatedTask] = await tx
        .update(measureTasks)
        .set({
          assignedWorkerId: workerId,
          status: 'DISPATCHING',
          updatedAt: new Date(),
        })
        .where(and(eq(measureTasks.id, taskId), eq(measureTasks.tenantId, tenantId)))
        .returning();

      if (!updatedTask) {
        logger.warn('[Dispatch] 指派失败：任务不存在或无权操作', { taskId, tenantId });
        throw new Error('测量任务不存在或无权限修改');
      }

      // 3. 记录审计
      await AuditService.record(
        {
          tenantId,
          userId: currentUserId,
          tableName: 'measure_tasks',
          recordId: taskId,
          action: 'UPDATE',
          changedFields: { assignedWorkerId: workerId, status: 'DISPATCHING' },
        },
        tx
      );

      logger.info('[Dispatch] 测量工人指派成功', { taskId, workerId, tenantId });
      revalidatePath('/dispatch');
      return { success: true, taskId: updatedTask.id };
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('未授权') || error.message.includes('不存在'))
    ) {
      throw error;
    }
    logger.error('[Dispatch] 指派测量工人发生异常', { taskId, workerId }, error);
    throw error;
  }
}

/**
 * 更新测量任务的流转状态
 *
 * 安全加固：执行前会验证会话身份和任务归属，失败时记录越权审计日志。
 * 支持的状态流转：
 * - PENDING_APPROVAL → PENDING → DISPATCHING → PENDING_VISIT → PENDING_CONFIRM → COMPLETED
 * - 任意状态 → CANCELLED（取消流程）
 *
 * 当任务完成（COMPLETED）时，自动记录完成时间。
 * 当任务不存在或操作者无权时，会额外记录「非法操作尝试」审计日志。
 *
 * @param taskId - 测量任务 ID
 * @param status - 目标状态，可选值为 PENDING_APPROVAL | PENDING | DISPATCHING | PENDING_VISIT | PENDING_CONFIRM | COMPLETED | CANCELLED
 * @returns 包含 success 状态和 taskId 的操作结果
 * @throws {Error} 当用户未授权（未登录或无租户信息）时抛出
 * @throws {Error} 当测量任务不存在或无权限修改时抛出
 */
export async function updateMeasureTaskStatus(
  taskId: string,
  status:
    | 'PENDING_APPROVAL'
    | 'PENDING'
    | 'DISPATCHING'
    | 'PENDING_VISIT'
    | 'PENDING_CONFIRM'
    | 'COMPLETED'
    | 'CANCELLED'
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    logger.warn('[Dispatch] 未授权尝试更新测量任务状态', { taskId, status });
    throw new Error('未授权访问');
  }

  const { tenantId, id: currentUserId } = session.user;
  logger.info('[Dispatch] 开始更新测量任务状态', { taskId, status, tenantId });

  try {
    return await db.transaction(async (tx) => {
      const [updatedTask] = await tx
        .update(measureTasks)
        .set({
          status,
          ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(measureTasks.id, taskId), eq(measureTasks.tenantId, tenantId)))
        .returning();

      if (!updatedTask) {
        // 额外审计：非法越权操作尝试
        await AuditService.record(
          {
            tenantId,
            userId: currentUserId,
            tableName: 'measure_tasks',
            recordId: taskId,
            action: 'ILLEGAL_ACCESS_ATTEMPT',
            changedFields: { attemptedStatus: status },
          },
          tx
        );
        logger.warn('[Dispatch] 更新状态失败：任务不存在或无权操作', { taskId, status, tenantId });
        throw new Error('测量任务不存在或无权限修改');
      }

      await AuditService.record(
        {
          tenantId,
          userId: currentUserId,
          tableName: 'measure_tasks',
          recordId: taskId,
          action: 'UPDATE',
          changedFields: { status },
        },
        tx
      );

      // 如果是取消操作，记录额外日志
      if (status === 'CANCELLED') {
        logger.info('[Dispatch] 测量任务已取消', { taskId, tenantId });
      }

      logger.info('[Dispatch] 测量任务状态更新成功', { taskId, status, tenantId });
      revalidatePath('/dispatch');
      return { success: true, taskId: updatedTask.id };
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('未授权') || error.message.includes('不存在'))
    ) {
      throw error;
    }
    logger.error('[Dispatch] 更新测量任务状态发生异常', { taskId, status }, error);
    throw error;
  }
}

// ============================================================================
// INSTALL TASKS (安装任务调度)
// ============================================================================

/**
 * 指派安装工人到指定的安装任务
 *
 * 安全加固：执行前会验证会话身份、工人租户归属和任务存在性。
 * 操作流程：
 * 1. 校验当前用户会话是否有效
 * 2. 验证目标安装工人是否属于当前租户（防止跨租户越权）
 * 3. 更新安装任务的指派工人、调度人员和分配时间，状态设为「调度中」
 * 4. 可选设置预约上门日期
 * 5. 记录操作审计日志
 * 6. 刷新调度页面缓存
 *
 * @param taskId - 安装任务 ID
 * @param installerId - 待指派的安装工人用户 ID
 * @param scheduledDate - 可选，预约上门日期
 * @returns 包含 success 状态和 taskId 的操作结果
 * @throws {Error} 当用户未授权（未登录或无租户信息）时抛出
 * @throws {Error} 当目标安装工人不存在或不属于当前租户时抛出
 * @throws {Error} 当安装任务不存在或无权限修改时抛出
 */
export async function assignInstallWorker(
  taskId: string,
  installerId: string,
  scheduledDate?: Date
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    logger.warn('[Dispatch] 未授权尝试指派安装工人', { taskId, installerId });
    throw new Error('未授权访问');
  }

  const { tenantId, id: currentUserId } = session.user;
  logger.info('[Dispatch] 开始指派安装工人', { taskId, installerId, tenantId });

  try {
    return await db.transaction(async (tx) => {
      // 1. 验证工人是否属于本租户
      const workerExists = await tx.query.users.findFirst({
        where: and(eq(users.id, installerId), eq(users.tenantId, tenantId)),
      });

      if (!workerExists) {
        logger.warn('[Dispatch] 安装指派失败：工人不存在或跨租户', { taskId, installerId, tenantId });
        throw new Error('目标安装工人不存在或不属于当前租户');
      }

      const [updatedTask] = await tx
        .update(installTasks)
        .set({
          installerId,
          status: 'DISPATCHING',
          dispatcherId: currentUserId,
          assignedAt: new Date(),
          ...(scheduledDate ? { scheduledDate } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(installTasks.id, taskId), eq(installTasks.tenantId, tenantId)))
        .returning();

      if (!updatedTask) {
        logger.warn('[Dispatch] 安装指派失败：任务不存在或无权操作', { taskId, tenantId });
        throw new Error('安装任务不存在或无权限修改');
      }

      await AuditService.record(
        {
          tenantId,
          userId: currentUserId,
          tableName: 'install_tasks',
          recordId: taskId,
          action: 'UPDATE',
          changedFields: { installerId, status: 'DISPATCHING' },
        },
        tx
      );

      logger.info('[Dispatch] 安装工人指派成功', { taskId, installerId, tenantId });
      revalidatePath('/dispatch');
      return { success: true, taskId: updatedTask.id };
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('未授权') || error.message.includes('不存在'))
    ) {
      throw error;
    }
    logger.error('[Dispatch] 指派安装工人发生异常', { taskId, installerId }, error);
    throw error;
  }
}

/**
 * 更新安装任务的流转状态
 *
 * 安全加固：执行前会验证会话身份和任务归属，失败时记录越权审计日志。
 * 支持的状态流转：
 * - PENDING_DISPATCH → DISPATCHING → PENDING_VISIT → PENDING_CONFIRM → COMPLETED
 *
 * 当任务完成（COMPLETED）时，自动记录完成时间。
 * 当任务不存在或操作者无权时，会额外记录「非法操作尝试」审计日志。
 *
 * @param taskId - 安装任务 ID
 * @param status - 目标状态，可选值为 PENDING_DISPATCH | DISPATCHING | PENDING_VISIT | PENDING_CONFIRM | COMPLETED
 * @returns 包含 success 状态和 taskId 的操作结果
 * @throws {Error} 当用户未授权（未登录或无租户信息）时抛出
 * @throws {Error} 当安装任务不存在或无权限修改时抛出
 */
export async function updateInstallTaskStatus(
  taskId: string,
  status: 'PENDING_DISPATCH' | 'DISPATCHING' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED'
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    logger.warn('[Dispatch] 未授权尝试更新安装任务状态', { taskId, status });
    throw new Error('未授权访问');
  }

  const { tenantId, id: currentUserId } = session.user;
  logger.info('[Dispatch] 开始更新安装任务状态', { taskId, status, tenantId });

  try {
    return await db.transaction(async (tx) => {
      const [updatedTask] = await tx
        .update(installTasks)
        .set({
          status,
          ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(installTasks.id, taskId), eq(installTasks.tenantId, tenantId)))
        .returning();

      if (!updatedTask) {
        // 越权审计
        await AuditService.record(
          {
            tenantId,
            userId: currentUserId,
            tableName: 'install_tasks',
            recordId: taskId,
            action: 'ILLEGAL_ACCESS_ATTEMPT',
            changedFields: { attemptedStatus: status },
          },
          tx
        );
        logger.warn('[Dispatch] 更新安装状态失败：任务不存在或无权操作', {
          taskId,
          status,
          tenantId,
        });
        throw new Error('安装任务不存在或无权限修改');
      }

      await AuditService.record(
        {
          tenantId,
          userId: currentUserId,
          tableName: 'install_tasks',
          recordId: taskId,
          action: 'UPDATE',
          changedFields: { status },
        },
        tx
      );

      logger.info('[Dispatch] 安装任务状态更新成功', { taskId, status, tenantId });
      revalidatePath('/dispatch');
      return { success: true, taskId: updatedTask.id };
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('未授权') || error.message.includes('不存在'))
    ) {
      throw error;
    }
    logger.error('[Dispatch] 更新安装任务状态发生异常', { taskId, status }, error);
    throw error;
  }
}
