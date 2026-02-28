'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { db } from '@/shared/api/db';
import { installTasks, installItems, users, customers, orders } from '@/shared/api/schema';
import { eq, and, desc, asc, or, ilike, count } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { checkSchedulingConflict } from './logic/conflict-detection';
import { checkLogisticsReady } from './logic/logistics-check';
import { notifyTaskAssigned } from '@/services/wechat-subscribe-message.service';
import { logger } from '@/shared/lib/logger';
import { AuditService } from '@/shared/lib/audit-service';

// --- Schemas ---

const createInstallTaskSchema = z.object({
  orderId: z.string().min(1, '订单 ID 必填'),
  customerId: z.string().min(1, '客户 ID 必填'),
  sourceType: z.enum(['ORDER', 'AFTER_SALES', 'REWORK']).default('ORDER'),
  afterSalesId: z.string().optional(),
  category: z.enum(['CURTAIN', 'WALLCLOTH', 'OTHER']).default('CURTAIN'),
  address: z.string().optional(),
  scheduledDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  scheduledTimeSlot: z.string().optional(),
  notes: z.string().optional(),
  installerId: z.string().optional(),
  laborFee: z.number().optional(),
});

const dispatchTaskSchema = z.object({
  id: z.string(),
  installerId: z.string().min(1, '必须选择安装师'),
  scheduledDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  scheduledTimeSlot: z.string().optional(),
  laborFee: z.number().optional(), // 保留向后兼容
  feeBreakdown: z
    .object({
      baseFee: z.number().min(0, '基础费不能为负数'),
      additionalFees: z
        .array(
          z.object({
            type: z.enum(['HIGH_ALTITUDE', 'LONG_DISTANCE', 'SPECIAL_WALL', 'OTHER']),
            amount: z.number().min(0),
            description: z.string().optional(),
            quantity: z.number().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  dispatcherNotes: z.string().optional(),
  force: z.boolean().optional(),
});

const checkInTaskSchema = z.object({
  id: z.string(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().optional(),
    })
    .optional(),
});

const checkOutTaskSchema = z.object({
  id: z.string(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().optional(),
    })
    .optional(),
  customerSignatureUrl: z.string().optional(),
});

const confirmInstallationSchema = z.object({
  taskId: z.string(),
  actualLaborFee: z.number().nonnegative('实际工费不能为负数'),
  adjustmentReason: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  ratingComment: z.string().optional(),
});

const updateInstallItemSchema = z.object({
  itemId: z.string(),
  isInstalled: z.boolean(),
  actualInstalledQuantity: z.number().optional(),
  issueCategory: z.enum(['NONE', 'MISSING', 'DAMAGED', 'WRONG_SIZE']).optional(), // 根据 enums.ts 定义
});

// --- Actions ---

/**
 * 获取安装任务列表 (支持搜索、筛选与分页)
 *
 * @param {Object} [params] - 查询参数
 * @param {number} [params.page=1] - 当前页码，从1开始
 * @param {number} [params.pageSize=20] - 每页显示的记录数
 * @param {string} [params.search] - 模糊搜索关键字，匹配订单号、客户姓名、电话或师傅名称
 * @param {string} [params.status] - 任务状态过滤条件 (如: PENDING_DISPATCH, COMPLETED)
 * @returns {Promise<{success: boolean, data?: any[], pagination?: any, error?: string}>} 返回带分页信息的任务列表或错误信息
 */
export const getInstallTasks = cache(
  async (params?: { page?: number; pageSize?: number; search?: string; status?: string }) => {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
      const { search, status, page = 1, pageSize = 20 } = params || {};
      const offset = (page - 1) * pageSize;

      // Build where conditions
      const conditions = [eq(installTasks.tenantId, session.user.tenantId)];

      if (status && status !== 'ALL') {
        conditions.push(
          eq(installTasks.status, status as (typeof installTasks.status.enumValues)[number])
        );
      }

      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(
          or(
            ilike(installTasks.taskNo, searchPattern),
            ilike(installTasks.customerName, searchPattern),
            ilike(installTasks.customerPhone, searchPattern),
            ilike(users.name, searchPattern) // Include installer name search
          )!
        );
      }

      // Get data and total count concurrently for better performance
      const [tasksData, countResult] = await Promise.all([
        db
          .select({
            installTask: installTasks,
            order: orders,
            customer: customers,
            installer: users,
          })
          .from(installTasks)
          .leftJoin(orders, eq(installTasks.orderId, orders.id))
          .leftJoin(customers, eq(installTasks.customerId, customers.id))
          .leftJoin(users, eq(installTasks.installerId, users.id))
          .where(and(...conditions))
          .orderBy(desc(installTasks.createdAt))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: count() })
          .from(installTasks)
          .leftJoin(users, eq(installTasks.installerId, users.id))
          .where(and(...conditions)),
      ]);

      const total = Number(countResult[0]?.count || 0);

      const tasks = tasksData.map((row) => ({
        ...row.installTask,
        order: row.order,
        customer: row.customer,
        installer: row.installer,
      }));

      return {
        success: true,
        data: tasks,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : '未知错误';
      logger.error('加载安装任务列表失败:', _error);
      return { success: false, error: `系统错误: ${errorMessage}` };
    }
  }
);

/**
 * 获取任务详情
 */
export async function getInstallTaskById(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) return { success: false, error: '未授权' };

  try {
    const getTask = unstable_cache(
      async () => {
        return await db.query.installTasks.findFirst({
          where: and(eq(installTasks.id, id), eq(installTasks.tenantId, session.user.tenantId)),
          with: {
            order: {
              with: {
                quote: {
                  with: {
                    items: true,
                  },
                },
              },
            },
            customer: true,
            installer: true,
            sales: true,
            dispatcher: true,
            items: true,
            photos: true,
          },
        });
      },
      [`install-task-${id}`],
      {
        tags: [`install-task-${id}`, 'install-task'],
        revalidate: 3600, // 1 hour
      }
    );

    const task = await getTask();
    return { success: true, data: task };
  } catch (_error: unknown) {
    logger.error('加载任务详情失败:', _error);
    return { success: false, error: '加载任务详情失败' };
  }
}

/**
 * 创建安装任务的内部执行函数
 *
 * 流程：
 * 1. 验证用户权限与租户身份
 * 2. 校验客户与订单是否存在
 * 3. 生成唯一的安装任务号 (INS-日期-随机码)
 * 4. 插入安装任务主表，并根据报价单项自动生成安装子项
 * 5. 记录创建操作的审计日志
 *
 * @param {z.infer<typeof createInstallTaskSchema>} data - 符合 Schema 校验的创建数据
 * @param {Object} ctx - Server Action 执行上下文，包含 Session 信息
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} 返回操作结果
 */
const createInstallTaskInternal = createSafeAction(createInstallTaskSchema, async (data, ctx) => {
  const session = ctx.session;
  if (!session?.user?.tenantId) return { success: false, error: '未授权' };

  // 权限检查：需要安装服务管理权限
  await checkPermission(session, PERMISSIONS.INSTALL.ALL_EDIT);

  try {
    const newTask = await db.transaction(async (tx) => {
      // 1. 获取冗余信息 (客户信息、归属销售)
      // P0 修复：客户查询添加租户验证
      const customerData = await tx.query.customers.findFirst({
        where: and(
          eq(customers.id, data.customerId),
          eq(customers.tenantId, session.user.tenantId)
        ),
      });

      if (!customerData) {
        throw new Error('客户不存在或无权访问');
      }

      // P0 修复：订单查询添加租户验证
      const orderData = await tx.query.orders.findFirst({
        where: and(eq(orders.id, data.orderId), eq(orders.tenantId, session.user.tenantId)),
        with: {
          quote: {
            with: {
              items: true,
            },
          },
        },
      });

      if (!orderData) {
        throw new Error('订单不存在或无权访问');
      }

      // P2 修复：使用更安全的任务号生成（日期前缀 + 随机后缀）
      const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const taskNo = `INS-${datePrefix}-${randomSuffix}`;

      const [newTaskResult] = await tx
        .insert(installTasks)
        .values({
          tenantId: session.user.tenantId,
          taskNo,
          sourceType: data.sourceType,
          afterSalesId: data.afterSalesId,
          orderId: data.orderId,
          customerId: data.customerId,
          customerName: customerData?.name,
          customerPhone: customerData?.phone,
          address: data.address || orderData?.deliveryAddress,
          category: data.category,
          status: data.installerId ? 'DISPATCHING' : 'PENDING_DISPATCH',
          salesId: orderData?.salesId,
          installerId: data.installerId,
          assignedAt: data.installerId ? new Date() : null,
          scheduledDate: data.scheduledDate,
          scheduledTimeSlot: data.scheduledTimeSlot,
          laborFee: data.laborFee?.toString(),
          notes: data.notes,
        })
        .returning();

      // 2. 自动从报价单生成安装项 (Install Items)
      if (orderData?.quote?.items && orderData.quote.items.length > 0) {
        const itemsToInsert = orderData.quote.items.map((item) => ({
          tenantId: session.user.tenantId,
          installTaskId: newTaskResult.id,
          orderItemId: item.id,
          productName: item.productName,
          roomName: item.roomName,
          quantity: item.quantity ? item.quantity.toString() : '0',
          isInstalled: false,
        }));

        await tx.insert(installItems).values(itemsToInsert);
      }

      return newTaskResult;
    });

    await AuditService.recordFromSession(session, 'installTasks', newTask.id, 'CREATE', {
      new: { orderId: data.orderId, customerId: data.customerId, sourceType: data.sourceType },
    });

    revalidateTag('install-task', {});
    return { success: true, message: '安装任务已创建' };
  } catch (_error: unknown) {
    logger.error('创建任务失败:', _error);
    return { success: false, error: '新建任务失败' };
  }
});

/**
 * 创建安装任务 Action
 * @param data 创建参数
 */
export async function createInstallTaskAction(data: z.infer<typeof createInstallTaskSchema>) {
  return createInstallTaskInternal(data);
}

/**
 * 指派师傅或重新派单的内部执行函数
 *
 * 流程：
 * 1. 校验调度权限
 * 2. 冲突检测：检查师傅在指定日期和时段是否已有任务 (Hard/Soft 冲突)
 * 3. 物流检查：核实关联订单的货物是否已到齐
 * 4. 更新任务状态为 DISPATCHING (已指派，待确认)
 * 5. 触发微信订阅消息通知师傅
 * 6. 记录派单审计日志
 *
 * @param {z.infer<typeof dispatchTaskSchema>} data - 指派参数，包含师傅ID、预约日期和时段
 * @param {Object} ctx - Server Action 执行上下文
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} 返回操作结果
 */
const dispatchInstallTaskInternal = createSafeAction(dispatchTaskSchema, async (data, ctx) => {
  const session = ctx.session;
  if (!session?.user?.tenantId) return { success: false, error: '未授权' };

  // P1 修复：添加权限检查
  await checkPermission(session, PERMISSIONS.INSTALL.ALL_EDIT);

  try {
    logger.info(`[Dispatch] 准备指派安装任务: ${data.id}, 师傅: ${data.installerId}`, {
      scheduledDate: data.scheduledDate,
      timeSlot: data.scheduledTimeSlot,
    });

    // 1. Check Conflicts
    if (data.scheduledDate && data.scheduledTimeSlot) {
      const conflict = await checkSchedulingConflict(
        data.installerId,
        data.scheduledDate,
        data.scheduledTimeSlot,
        session.user.tenantId, // 租户隔离 - 移到可选参数之前
        data.id,
        undefined // targetAddress
      );

      if (conflict.hasConflict) {
        if (conflict.conflictType === 'HARD') {
          return { success: false, error: conflict.message }; // Hard block
        }
        if (conflict.conflictType === 'SOFT' && !data.force) {
          return { success: false, error: `CONFLICT_SOFT: ${conflict.message}` };
        }
      }
    }

    // 2. Check Logistics (Optimization: fetch orderId first)
    // We need existing task to get orderId to check logistics
    // But we are about to update it.
    // Let's fetch it.
    const existingTask = await db.query.installTasks.findFirst({
      where: and(eq(installTasks.id, data.id), eq(installTasks.tenantId, session.user.tenantId)),
      columns: { orderId: true },
    });

    if (existingTask) {
      const logistics = await checkLogisticsReady(existingTask.orderId, session.user.tenantId);
      if (!logistics.ready && !data.force) {
        return { success: false, error: `LOGISTICS_NOT_READY: ${logistics.message}` };
      }

      // Update logistics status
      await db
        .update(installTasks)
        .set({ logisticsReadyStatus: logistics.ready })
        .where(eq(installTasks.id, data.id));
    }

    const installer = await db.query.users.findFirst({
      where: and(
        eq(users.id, data.installerId),
        eq(users.tenantId, session.user.tenantId) // P0-8 Fix: Tenant isolation
      ),
    });

    await db
      .update(installTasks)
      .set({
        installerId: data.installerId,
        installerName: installer?.name,
        dispatcherId: session.user.id,
        status: 'DISPATCHING', // 已指派，待师傅接单
        scheduledDate: data.scheduledDate,
        scheduledTimeSlot: data.scheduledTimeSlot,
        laborFee: data.laborFee?.toString(),
        assignedAt: new Date(),
        notes: data.dispatcherNotes,
      })
      .where(
        and(
          eq(installTasks.id, data.id), // No force logic needed here, just update
          eq(installTasks.tenantId, session.user.tenantId)
        )
      );

    await AuditService.recordFromSession(session, 'installTasks', data.id, 'UPDATE', {
      new: {
        status: 'DISPATCHING',
        installerId: data.installerId,
        scheduledDate: data.scheduledDate,
        event: 'DISPATCH_TASK',
      },
    });

    logger.info(`[Dispatch] 安装任务指派成功: ${data.id}`);

    // 3. 发送任务通知
    if (data.installerId) {
      const taskInfo = await db.query.installTasks.findFirst({
        where: and(eq(installTasks.id, data.id), eq(installTasks.tenantId, session.user.tenantId)),
        columns: { taskNo: true, scheduledDate: true },
      });

      if (taskInfo) {
        notifyTaskAssigned(
          data.installerId,
          taskInfo.taskNo,
          '安装任务',
          taskInfo.scheduledDate ? new Date(taskInfo.scheduledDate).toLocaleString('zh-CN') : '尽快'
        ).catch((err) => logger.error('通知发送失败:', err));
      }
    }

    // 记录派单审计日志
    await AuditService.recordFromSession(session, 'installTasks', data.id, 'UPDATE', {
      new: {
        action: 'DISPATCH',
        installerId: data.installerId,
        scheduledDate: data.scheduledDate?.toISOString(),
      },
    });

    revalidateTag('install-task', {});
    return { success: true, message: '指派成功' };
  } catch (_error: unknown) {
    logger.error('分配失败:', _error);
    return { success: false, error: '分配失败' };
  }
});

/**
 * 指派师傅 Action
 * @param data 指派参数
 */
export async function dispatchInstallTaskAction(data: z.infer<typeof dispatchTaskSchema>) {
  return dispatchInstallTaskInternal(data);
}

/**
 * 安装师傅上门签到逻辑
 *
 * 流程：
 * 1. 验证任务存在性与师傅身份
 * 2. 检查任务状态是否为可签到状态 (DISPATCHING)
 * 3. 记录签到地点与时间，并与预约时间对比进行迟到检测
 * 4. 状态流转至 PENDING_VISIT (服务中)
 *
 * @param {z.infer<typeof checkInTaskSchema>} data - 签到数据，包含地理位置坐标
 * @param {Object} ctx - 执行上下文
 * @returns {Promise<{success: boolean, message?: string, data?: any, error?: string}>} 返回签到结果，包含迟到详情
 */
const checkInInstallTaskInternal = createSafeAction(checkInTaskSchema, async (data, ctx) => {
  const session = ctx.session;
  if (!session?.user?.tenantId) return { success: false, error: '未授权' };

  try {
    // 获取任务信息
    const task = await db.query.installTasks.findFirst({
      where: and(eq(installTasks.id, data.id), eq(installTasks.tenantId, session.user.tenantId)),
      columns: {
        id: true,
        scheduledDate: true,
        installerId: true, // 用于角色验证
        status: true, // P2 修复：用于状态检查
      },
    });

    if (!task) {
      return { success: false, error: '任务不存在' };
    }

    // P2 修复：状态检查 - 只有 DISPATCHING 状态的任务可以签到
    if (task.status !== 'DISPATCHING') {
      const statusMessages: Record<string, string> = {
        PENDING_DISPATCH: '任务尚未派单',
        PENDING_VISIT: '任务已签到',
        PENDING_CONFIRM: '任务已完工待确认',
        COMPLETED: '任务已完成',
        CANCELLED: '任务已取消',
      };
      const msg = statusMessages[task.status] || `任务状态不正确 (${task.status})`;
      return { success: false, error: msg };
    }

    // P1 修复：角色验证 - 只有指派的安装师或管理员可以签到
    if (task.installerId && session.user.id !== task.installerId && session.user.role !== 'ADMIN') {
      return { success: false, error: '只有指派的安装师可以签到' };
    }

    // 迟到检测
    let isLate = false;
    let lateMinutes = 0;

    if (task.scheduledDate) {
      const { calculateLateMinutes } = await import('@/shared/lib/gps-utils');
      const scheduledTime = new Date(task.scheduledDate);
      const checkInTime = new Date();

      lateMinutes = calculateLateMinutes(scheduledTime, checkInTime);
      isLate = lateMinutes > 0;
    }

    // 更新任务状态
    // 注意：GPS 距离校验需要 schema 添加 addressLocation 字段后启用
    await db
      .update(installTasks)
      .set({
        status: 'PENDING_VISIT', // 状态变更为：上门/施工中
        checkInAt: new Date(),
        actualStartAt: new Date(), // 默认签到即开始施工
        checkInLocation: data.location,
      })
      .where(and(eq(installTasks.id, data.id), eq(installTasks.tenantId, session.user.tenantId)));

    // 记录签到审计日志
    await AuditService.recordFromSession(session, 'installTasks', data.id, 'UPDATE', {
      new: { action: 'CHECK_IN', location: data.location },
    });

    revalidateTag('install-task', {});

    // 构建返回消息
    let message = '签到成功';
    if (isLate) {
      message += `，迟到 ${lateMinutes} 分钟`;
    }

    return {
      success: true,
      message,
      data: {
        isLate,
        lateMinutes,
      },
    };
  } catch (_error: unknown) {
    logger.error('签到异常:', _error);
    return { success: false, error: '签到异常' };
  }
});

/**
 * 师傅签到 Action
 * @param data 签到参数 (ID + 地理位置)
 */
export async function checkInInstallTaskAction(data: z.infer<typeof checkInTaskSchema>) {
  return checkInInstallTaskInternal(data);
}

/**
 * 师傅签退并提交申请 (Check Out)
 */
const checkOutInstallTaskInternal = createSafeAction(checkOutTaskSchema, async (data, ctx) => {
  const session = ctx.session;
  if (!session?.user?.tenantId) return { success: false, error: '未授权' };

  try {
    const task = await db.query.installTasks.findFirst({
      where: and(eq(installTasks.id, data.id), eq(installTasks.tenantId, session.user.tenantId)),
    });

    if (!task) return { success: false, error: '任务不存在' };

    // P1 修复：角色验证 - 只有指派的安装师或管理员可以签退
    if (task.installerId && session.user.id !== task.installerId && session.user.role !== 'ADMIN') {
      return { success: false, error: '只有指派的安装师可以签退' };
    }

    const checklistStatus = task.checklistStatus as { allCompleted?: boolean } | null;
    if (!checklistStatus?.allCompleted) {
      return { success: false, error: '请先完成所有标准化作业检查项' };
    }

    await db
      .update(installTasks)
      .set({
        status: 'PENDING_CONFIRM', // 完工待确认
        checkOutAt: new Date(),
        actualEndAt: new Date(), // 默认签退即结束施工
        checkOutLocation: data.location,
        customerSignatureUrl: data.customerSignatureUrl,
        signedAt: data.customerSignatureUrl ? new Date() : undefined,
      })
      .where(and(eq(installTasks.id, data.id), eq(installTasks.tenantId, session.user.tenantId)));

    // 记录签退审计日志
    await AuditService.recordFromSession(session, 'installTasks', data.id, 'UPDATE', {
      new: { action: 'CHECK_OUT' },
    });

    revalidateTag('install-task', {});
    return { success: true, message: '已提交完工申请，待销售验收' };
  } catch (_error: unknown) {
    logger.error('提交签退异常:', _error);
    return { success: false, error: '提交失败' };
  }
});

/**
 * 师傅签退并提交完工申请 Action
 * @param data 签退参数 (ID + 地理位置 + 客户签名)
 */
export async function checkOutInstallTaskAction(data: z.infer<typeof checkOutTaskSchema>) {
  return checkOutInstallTaskInternal(data);
}

/**
 * 销售或管理人员确认安装验收
 *
 * 此操作标志着安装服务的正式终结。
 *
 * 流程：
 * 1. 权限与租户隔离验证
 * 2. 将任务状态更新为 COMPLETED
 * 3. 记录最终确定的工费、调整原因及评价信息
 * 4. 记录验收操作审计日志
 * 5. (待扩展) 联动财务模块生成对账记录
 *
 * @param {z.infer<typeof confirmInstallationSchema>} data - 验收参数，包含实际工费和评分
 * @param {Object} ctx - 执行上下文
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} 返回验收结果
 */
const confirmInstallationInternal = createSafeAction(
  confirmInstallationSchema,
  async (data, ctx) => {
    const session = ctx.session;
    // P0 修复：必须验证 tenantId
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    // P1 修复：添加权限检查
    await checkPermission(session, PERMISSIONS.INSTALL.ALL_EDIT);

    return db.transaction(async (tx) => {
      // P0 修复：添加租户隔离
      const task = await tx.query.installTasks.findFirst({
        where: and(
          eq(installTasks.id, data.taskId),
          eq(installTasks.tenantId, session.user.tenantId)
        ),
      });

      if (!task || !task.installerId) {
        return { success: false, error: '任务信息不完整或未指派师傅' };
      }

      // 1. 更新安装单状态
      await tx
        .update(installTasks)
        .set({
          status: 'COMPLETED',
          actualLaborFee: data.actualLaborFee.toString(),
          adjustmentReason: data.adjustmentReason,
          rating: data.rating,
          ratingComment: data.ratingComment,
          confirmedAt: new Date(),
          confirmedBy: session.user.id,
          completedAt: new Date(),
        })
        .where(
          and(eq(installTasks.id, data.taskId), eq(installTasks.tenantId, session.user.tenantId))
        );

      // 2. 联动逻辑：NOTE - 自动创建劳务支出对账单记录 (Finance Module Integration)
      // 此处应调用 finance actions 或直接操作 ap_statements (如果表存在)

      // 3. 联动逻辑：NOTE - 检测并更新订单状态 (Order Module Integration)
      // checkAllTasksCompleted(task.orderId)

      // 记录验收确认审计日志
      await AuditService.recordFromSession(session, 'installTasks', data.taskId, 'UPDATE', {
        new: { action: 'CONFIRM', actualLaborFee: data.actualLaborFee, rating: data.rating },
      });

      revalidateTag('install-task', {});
      return { success: true, message: '验收通过，安装完成' };
    });
  }
);

/**
 * 销售确认验收 (正式完结) Action
 * @param data 验收参数 (任务 ID + 实际工费 + 评分等)
 */
export async function confirmInstallationAction(data: z.infer<typeof confirmInstallationSchema>) {
  return confirmInstallationInternal(data);
}

/**
 * 驳回任务 (返回重新指派或施工)
 */
const rejectInstallationInternal = createSafeAction(
  z.object({
    id: z.string(),
    reason: z.string().min(1, '必须说明原因'),
  }),
  async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    // P1 修复：添加权限检查
    await checkPermission(session, PERMISSIONS.INSTALL.ALL_EDIT);

    // P0 修复：添加租户隔离查询
    const task = await db.query.installTasks.findFirst({
      where: and(eq(installTasks.id, data.id), eq(installTasks.tenantId, session.user.tenantId)),
    });

    if (!task) {
      return { success: false, error: '任务不存在或无权访问' };
    }

    // P1 修复：状态校验 - 仅允许驳回【待验收】或【已签到/施工中】的任务
    // 如果任务已完成或取消，不可驳回
    const allowRejectStatus = ['PENDING_CONFIRM', 'PENDING_VISIT'];
    if (!allowRejectStatus.includes(task.status || '')) {
      return { success: false, error: `当前状态 (${task.status}) 不可驳回` };
    }

    const currentRejectCount = task.rejectCount || 0;

    // P0 修复：更新时也加入租户隔离条件
    await db
      .update(installTasks)
      .set({
        status: 'PENDING_VISIT', // 退回上门状态
        rejectReason: data.reason,
        rejectCount: currentRejectCount + 1,
        remark: `[${new Date().toLocaleString()}] 验收驳回: ${data.reason}`,
      })
      .where(and(eq(installTasks.id, data.id), eq(installTasks.tenantId, session.user.tenantId)));

    // 记录驳回审计日志
    await AuditService.recordFromSession(session, 'installTasks', data.id, 'UPDATE', {
      new: { action: 'REJECT', rejectReason: data.reason },
    });

    revalidateTag('install-task', {});
    return { success: true, message: '已驳回任务' };
  }
);

/**
 * 驳回任务 Action (返回重新指派或施工)
 * @param data 驳回参数 (ID + 原因)
 */
export async function rejectInstallationAction(data: { id: string; reason: string }) {
  return rejectInstallationInternal(data);
}

/**
 * 更新安装项状态 (师傅/工长操作)
 */
const updateInstallItemStatusInternal = createSafeAction(
  updateInstallItemSchema,
  async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
      await db
        .update(installItems)
        .set({
          isInstalled: data.isInstalled,
          actualInstalledQuantity: data.actualInstalledQuantity
            ? data.actualInstalledQuantity.toString()
            : undefined,
          issueCategory: data.issueCategory || 'NONE',
          updatedAt: new Date(),
        })
        .where(
          and(eq(installItems.id, data.itemId), eq(installItems.tenantId, session.user.tenantId))
        );

      // 记录安装项状态更新审计日志
      await AuditService.recordFromSession(session, 'installItems', data.itemId, 'UPDATE', {
        new: { isInstalled: data.isInstalled, issueCategory: data.issueCategory },
      });

      revalidateTag('install-task', {});
      return { success: true, message: '详情已记录' };
    } catch (_error: unknown) {
      logger.error('更新安装项状态失败:', _error);
      return { success: false, error: '更新失败' };
    }
  }
);

/**
 * 更新安装项状态 Action (师傅/工长操作)
 * @param data 更新参数 (单项 ID + 安装状态 + 异常分类)
 */
export async function updateInstallItemStatusAction(data: z.infer<typeof updateInstallItemSchema>) {
  return updateInstallItemStatusInternal(data);
}

const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  isChecked: z.boolean(),
  photoUrl: z.string().optional(),
  required: z.boolean().default(true),
});

const updateChecklistSchema = z.object({
  taskId: z.string(),
  items: z.array(checklistItemSchema),
});

/**
 * 更新安装清单状态
 */
const updateInstallChecklistInternal = createSafeAction(
  updateChecklistSchema,
  async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
      const allCompleted = data.items.every((item) => (item.required ? item.isChecked : true));

      await db
        .update(installTasks)
        .set({
          checklistStatus: {
            items: data.items,
            allCompleted,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(
          and(eq(installTasks.id, data.taskId), eq(installTasks.tenantId, session.user.tenantId))
        );

      // 记录清单状态更新审计日志
      await AuditService.recordFromSession(session, 'installTasks', data.taskId, 'UPDATE', {
        new: { action: 'UPDATE_CHECKLIST', allCompleted },
      });

      revalidateTag('install-task', {});
      return { success: true, message: '清单状态已更新' };
    } catch (_error: unknown) {
      logger.error('更新清单失败:', _error);
      return { success: false, error: '更新清单失败' };
    }
  }
);

/**
 * 更新安装清单状态 Action
 * @param data 更新参数 (任务 ID + 检查项列表)
 */
export async function updateInstallChecklistAction(data: z.infer<typeof updateChecklistSchema>) {
  return updateInstallChecklistInternal(data);
}

/**
 * 获取可用师傅列表
 */
export async function getInstallWorkersAction() {
  const session = await auth();
  if (!session?.user?.tenantId) return { success: false, error: '未授权' };

  try {
    const getWorkers = unstable_cache(
      async () => {
        return await db.query.users.findMany({
          where: and(eq(users.tenantId, session.user.tenantId), eq(users.role, 'WORKER')),
          orderBy: [asc(users.name)],
        });
      },
      [`install-workers-${session.user.tenantId}`],
      {
        tags: [`install-workers-${session.user.tenantId}`, 'install-workers'],
        revalidate: 3600, // 1 hour
      }
    );

    const workers = await getWorkers();
    return { success: true, data: workers };
  } catch (_error: unknown) {
    logger.error('获取师傅列表失败:', _error);
    return { success: false, error: '获取师傅列表失败' };
  }
}
