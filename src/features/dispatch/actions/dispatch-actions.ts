'use server';

import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema/service';
import { users } from '@/shared/api/schema/infrastructure';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { logger } from '@/shared/lib/logger';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * 审计上下文接口
 */
interface AuditContext {
  userId: string;
  tenantId: string;
  ip: string;
  userAgent: string;
  path: string;
}

/**
 * 包装 AuditContext
 */
function createAuditContext(userId: string, tenantId: string): AuditContext {
  return {
    userId,
    tenantId,
    ip: '127.0.0.1',
    userAgent: 'Dispatch Action',
    path: '/dispatch',
  };
}

// ============================================================================
// MEASURE TASKS (测量任务调度)
// ============================================================================

/**
 * [安全加固] 指派测量工人
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
    // 1. 验证工人是否属于本租户
    const workerExists = await db.query.users.findFirst({
      where: and(eq(users.id, workerId), eq(users.tenantId, tenantId)),
    });

    if (!workerExists) {
      logger.warn('[Dispatch] 指派失败：目标工人不存在或跨租户', { taskId, workerId, tenantId });
      throw new Error('目标工人不存在或不属于当前租户');
    }

    // 2. 更新任务，强制带上 tenantId 隔离
    const [updatedTask] = await db
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
    await AuditService.recordFromSession(
      createAuditContext(currentUserId, tenantId),
      'measure_tasks',
      taskId,
      'UPDATE',
      {
        changed: { assignedWorkerId: workerId, status: 'DISPATCHING' },
      }
    );

    logger.info('[Dispatch] 测量工人指派成功', { taskId, workerId, tenantId });
    revalidatePath('/dispatch');
    return { success: true, taskId: updatedTask.id };
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
 * [安全加固] 更新测量任务状态
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
    const [updatedTask] = await db
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
      await AuditService.record({
        tenantId,
        userId: currentUserId,
        tableName: 'measure_tasks',
        recordId: taskId,
        action: 'ILLEGAL_ACCESS_ATTEMPT',
        changedFields: { attemptedStatus: status },
      });
      logger.warn('[Dispatch] 更新状态失败：任务不存在或无权操作', { taskId, status, tenantId });
      throw new Error('测量任务不存在或无权限修改');
    }

    await AuditService.recordFromSession(
      createAuditContext(currentUserId, tenantId),
      'measure_tasks',
      taskId,
      'UPDATE',
      {
        changed: { status },
      }
    );

    // 如果是取消操作，记录额外日志
    if (status === 'CANCELLED') {
      logger.info('[Dispatch] 测量任务已取消', { taskId, tenantId });
    }

    logger.info('[Dispatch] 测量任务状态更新成功', { taskId, status, tenantId });
    revalidatePath('/dispatch');
    return { success: true, taskId: updatedTask.id };
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
 * [安全加固] 指派安装工人
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
    // 1. 验证工人是否属于本租户
    const workerExists = await db.query.users.findFirst({
      where: and(eq(users.id, installerId), eq(users.tenantId, tenantId)),
    });

    if (!workerExists) {
      logger.warn('[Dispatch] 安装指派失败：工人不存在或跨租户', { taskId, installerId, tenantId });
      throw new Error('目标安装工人不存在或不属于当前租户');
    }

    const [updatedTask] = await db
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

    await AuditService.recordFromSession(
      createAuditContext(currentUserId, tenantId),
      'install_tasks',
      taskId,
      'UPDATE',
      {
        changed: { installerId, status: 'DISPATCHING' },
      }
    );

    logger.info('[Dispatch] 安装工人指派成功', { taskId, installerId, tenantId });
    revalidatePath('/dispatch');
    return { success: true, taskId: updatedTask.id };
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
 * [安全加固] 更新安装任务状态
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
    const [updatedTask] = await db
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
      await AuditService.record({
        tenantId,
        userId: currentUserId,
        tableName: 'install_tasks',
        recordId: taskId,
        action: 'ILLEGAL_ACCESS_ATTEMPT',
        changedFields: { attemptedStatus: status },
      });
      logger.warn('[Dispatch] 更新安装状态失败：任务不存在或无权操作', {
        taskId,
        status,
        tenantId,
      });
      throw new Error('安装任务不存在或无权限修改');
    }

    await AuditService.recordFromSession(
      createAuditContext(currentUserId, tenantId),
      'install_tasks',
      taskId,
      'UPDATE',
      {
        changed: { status },
      }
    );

    logger.info('[Dispatch] 安装任务状态更新成功', { taskId, status, tenantId });
    revalidatePath('/dispatch');
    return { success: true, taskId: updatedTask.id };
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
