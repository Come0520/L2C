'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import {
    installTasks,
    installItems,
    users,
    customers,
    orders
} from '@/shared/api/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { checkSchedulingConflict } from './logic/conflict-detection';
import { checkLogisticsReady } from './logic/logistics-check';

// --- Schemas ---

const createInstallTaskSchema = z.object({
    orderId: z.string().min(1, "订单 ID 必填"),
    customerId: z.string().min(1, "客户 ID 必填"),
    sourceType: z.enum(['ORDER', 'AFTER_SALES', 'REWORK']).default('ORDER'),
    afterSalesId: z.string().optional(),
    category: z.enum(['CURTAIN', 'WALLCLOTH', 'OTHER']).default('CURTAIN'),
    address: z.string().optional(),
    scheduledDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    scheduledTimeSlot: z.string().optional(),
    notes: z.string().optional(),
    installerId: z.string().optional(),
    laborFee: z.number().optional(),
});

const dispatchTaskSchema = z.object({
    id: z.string(),
    installerId: z.string().min(1, "必须选择安装师"),
    scheduledDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    scheduledTimeSlot: z.string().optional(),
    laborFee: z.number().optional(), // 保留向后兼容
    feeBreakdown: z.object({
        baseFee: z.number().min(0, "基础费不能为负数"),
        additionalFees: z.array(z.object({
            type: z.enum(['HIGH_ALTITUDE', 'LONG_DISTANCE', 'SPECIAL_WALL', 'OTHER']),
            amount: z.number().min(0),
            description: z.string().optional(),
            quantity: z.number().optional(),
        })).optional(),
    }).optional(),
    dispatcherNotes: z.string().optional(),
    force: z.boolean().optional(),
});

const checkInTaskSchema = z.object({
    id: z.string(),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
    }).optional(),
});

const checkOutTaskSchema = z.object({
    id: z.string(),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
    }).optional(),
    customerSignatureUrl: z.string().optional(),
});

const confirmInstallationSchema = z.object({
    taskId: z.string(),
    actualLaborFee: z.number().nonnegative("实际工费不能为负数"),
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
 * 获取安装任务列表
 */
export const getInstallTasks = async () => {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        const tasks = await db.query.installTasks.findMany({
            where: eq(installTasks.tenantId, session.user.tenantId),
            orderBy: [desc(installTasks.createdAt)],
            with: {
                order: true,
                customer: true,
                installer: true,
            }
        });
        return { success: true, data: tasks };
    } catch (_error) {
        console.error("加载安装任务列表失败:", _error);
        return { success: false, error: "系统繁忙，请稍后重试" };
    }
};

/**
 * 获取任务详情
 */
export const getInstallTaskById = async (id: string) => {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, id),
                eq(installTasks.tenantId, session.user.tenantId)
            ),
            with: {
                order: {
                    with: {
                        quote: {
                            with: {
                                items: true
                            }
                        }
                    }
                },
                customer: true,
                installer: true,
                sales: true,
                dispatcher: true,
                items: true,
                photos: true,


            }
        });
        return { success: true, data: task };
    } catch (_error) {
        return { success: false, error: "加载任务详情失败" };
    }
};

/**
 * 创建安装单
 */
export const createInstallTaskAction = createSafeAction(createInstallTaskSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        await db.transaction(async (tx) => {
            // 1. 获取冗余信息 (客户信息、归属销售)
            const customerData = await tx.query.customers.findFirst({
                where: eq(customers.id, data.customerId),
            });

            const orderData = await tx.query.orders.findFirst({
                where: eq(orders.id, data.orderId),
                with: {
                    quote: {
                        with: {
                            items: true
                        }
                    }
                }
            });

            const taskNo = `INS-${Date.now()}`; // 实际应使用更严谨的序列号生成

            const [newTask] = await tx.insert(installTasks).values({
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
            }).returning();

            // 2. 自动从报价单生成安装项 (Install Items)
            if (orderData?.quote?.items && orderData.quote.items.length > 0) {
                const itemsToInsert = orderData.quote.items.map(item => ({
                    tenantId: session.user.tenantId,
                    installTaskId: newTask.id,
                    orderItemId: item.id,
                    productName: item.productName,
                    roomName: item.roomName,
                    quantity: item.quantity ? item.quantity.toString() : '0',
                    isInstalled: false,
                }));

                await tx.insert(installItems).values(itemsToInsert);
            }
        });

        revalidatePath('/service/installation');

        return { success: true, message: "安装任务已创建" };
    } catch (_error) {
        console.error("创建任务失败:", _error);
        return { success: false, error: "新建任务失败" };
    }
});

/**
 * 指派师傅 / 重新派单
 */
export const dispatchInstallTaskAction = createSafeAction(dispatchTaskSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        // 1. Check Conflicts
        if (data.scheduledDate && data.scheduledTimeSlot) {
            const conflict = await checkSchedulingConflict(
                data.installerId,
                data.scheduledDate,
                data.scheduledTimeSlot,
                data.id
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
            columns: { orderId: true }
        });

        if (existingTask) {
            const logistics = await checkLogisticsReady(existingTask.orderId);
            if (!logistics.ready && !data.force) {
                return { success: false, error: `LOGISTICS_NOT_READY: ${logistics.message}` };
            }

            // Update logistics status
            await db.update(installTasks)
                .set({ logisticsReadyStatus: logistics.ready })
                .where(eq(installTasks.id, data.id));
        }

        const installer = await db.query.users.findFirst({
            where: eq(users.id, data.installerId),
        });

        await db.update(installTasks)
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
            .where(and(
                eq(installTasks.id, data.id), // No force logic needed here, just update
                eq(installTasks.tenantId, session.user.tenantId)
            ));

        revalidatePath('/service/installation');
        return { success: true, message: "指派成功" };
    } catch (_error) {
        return { success: false, error: "分配失败" };
    }
});

/**
 * 师傅签到
 */
export const checkInInstallTaskAction = createSafeAction(checkInTaskSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        // 获取任务信息
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, data.id),
                eq(installTasks.tenantId, session.user.tenantId)
            ),
            columns: {
                id: true,
                scheduledDate: true,
            }
        });

        if (!task) {
            return { success: false, error: '任务不存在' };
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
        await db.update(installTasks)
            .set({
                status: 'PENDING_VISIT', // 状态变更为：上门/施工中
                checkInAt: new Date(),
                actualStartAt: new Date(), // 默认签到即开始施工
                checkInLocation: data.location,
            })
            .where(and(
                eq(installTasks.id, data.id),
                eq(installTasks.tenantId, session.user.tenantId)
            ));

        revalidatePath('/service/installation');

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
            }
        };
    } catch (_error) {
        console.error('签到异常:', _error);
        return { success: false, error: '签到异常' };
    }
});


/**
 * 师傅签退并提交申请 (Check Out)
 */
export const checkOutInstallTaskAction = createSafeAction(checkOutTaskSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, data.id),
                eq(installTasks.tenantId, session.user.tenantId)
            )
        });

        if (!task) return { success: false, error: "任务不存在" };

        const checklistStatus = task.checklistStatus as any;
        if (!checklistStatus?.allCompleted) {
            return { success: false, error: "请先完成所有标准化作业检查项" };
        }

        await db.update(installTasks)
            .set({
                status: 'PENDING_CONFIRM', // 完工待确认
                checkOutAt: new Date(),
                actualEndAt: new Date(), // 默认签退即结束施工
                checkOutLocation: data.location,
                customerSignatureUrl: data.customerSignatureUrl,
                signedAt: data.customerSignatureUrl ? new Date() : undefined,
            })
            .where(and(
                eq(installTasks.id, data.id),
                eq(installTasks.tenantId, session.user.tenantId)
            ));

        revalidatePath('/service/installation');
        return { success: true, message: "已提交完工申请，待销售验收" };
    } catch (_error) {
        return { success: false, error: "提交失败" };
    }
});


/**
 * 销售确认验收 (正式完结)
 */
export const confirmInstallationAction = createSafeAction(confirmInstallationSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user) return { success: false, error: '未授权' };

    return db.transaction(async (tx) => {
        const task = await tx.query.installTasks.findFirst({
            where: eq(installTasks.id, data.taskId),
        });

        if (!task || !task.installerId) {
            return { success: false, error: '任务信息不完整或未指派师傅' };
        }

        // 1. 更新安装单状态
        await tx.update(installTasks).set({
            status: 'COMPLETED',
            actualLaborFee: data.actualLaborFee.toString(),
            adjustmentReason: data.adjustmentReason,
            rating: data.rating,
            ratingComment: data.ratingComment,
            confirmedAt: new Date(),
            confirmedBy: session.user.id,
            completedAt: new Date(),
        }).where(eq(installTasks.id, data.taskId));

        // 2. 联动逻辑：TODO - 自动创建劳务支出对账单记录 (Finance Module Integration)
        // 此处应调用 finance actions 或直接操作 ap_statements (如果表存在)

        // 3. 联动逻辑：TODO - 检测并更新订单状态 (Order Module Integration)
        // checkAllTasksCompleted(task.orderId)

        revalidatePath('/service/installation');
        return { success: true, message: '验收通过，安装完成' };
    });
});

/**
 * 驳回任务 (返回重新指派或施工)
 */
export const rejectInstallationAction = createSafeAction(z.object({
    id: z.string(),
    reason: z.string().min(1, "必须说明原因")
}), async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    const task = await db.query.installTasks.findFirst({ where: eq(installTasks.id, data.id) });
    const currentRejectCount = task?.rejectCount || 0;

    await db.update(installTasks)
        .set({
            status: 'PENDING_VISIT', // 退回上门状态
            rejectReason: data.reason,
            rejectCount: currentRejectCount + 1,
            remark: `[${new Date().toLocaleString()}] 验收驳回: ${data.reason}`
        })
        .where(eq(installTasks.id, data.id));

    revalidatePath('/service/installation');
    return { success: true, message: "已驳回任务" };
});

/**
 * 更新安装项状态 (师傅/工长操作)
 */
export const updateInstallItemStatusAction = createSafeAction(updateInstallItemSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        await db.update(installItems)
            .set({
                isInstalled: data.isInstalled,
                actualInstalledQuantity: data.actualInstalledQuantity ? data.actualInstalledQuantity.toString() : undefined,
                issueCategory: data.issueCategory || 'NONE',
                updatedAt: new Date(),
            })
            .where(and(
                eq(installItems.id, data.itemId),
                eq(installItems.tenantId, session.user.tenantId)
            ));

        revalidatePath('/service/installation');
        return { success: true, message: "状态已更新" };
    } catch (_error) {
        return { success: false, error: "更新失败" };
    }
});

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
const updateInstallChecklistAction = createSafeAction(updateChecklistSchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        const allCompleted = data.items.every(item => item.required ? item.isChecked : true);

        await db.update(installTasks)
            .set({
                checklistStatus: {
                    items: data.items,
                    allCompleted,
                    updatedAt: new Date().toISOString()
                },
                updatedAt: new Date(),
            })
            .where(and(
                eq(installTasks.id, data.taskId),
                eq(installTasks.tenantId, session.user.tenantId)
            ));

        revalidatePath('/service/installation');
        return { success: true, message: "清单状态已更新" };
    } catch (_error) {
        return { success: false, error: "更新清单失败" };
    }
});



/**
 * 获取可用师傅列表
 */
export const getInstallWorkersAction = async () => {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        const workers = await db.query.users.findMany({
            where: and(
                eq(users.tenantId, session.user.tenantId),
                eq(users.role, 'WORKER') // 注意：此处根据 schema 可能为 WORKER 或 INSTALLER，审计报告建议专门区分
            ),
            orderBy: [asc(users.name)]
        });
        return { success: true, data: workers };
    } catch (_error) {
        return { success: false, error: "获取师傅列表失败" };
    }
};

// --- Barrel Exports for Compatibility ---
export const assignInstallWorker = dispatchInstallTaskAction;
export const completeInstallTask = confirmInstallationAction;
export const rejectInstallTask = rejectInstallationAction;
export const getAvailableWorkers = getInstallWorkersAction;
export const createInstallTask = createInstallTaskAction;
export const dispatchInstallTask = dispatchInstallTaskAction;
export const checkInInstallTask = checkInInstallTaskAction;
export const confirmInstallation = confirmInstallationAction;
export const rejectInstallation = rejectInstallationAction;
export const updateInstallItemStatus = updateInstallItemStatusAction;
export const updateInstallChecklist = updateInstallChecklistAction;
export const getRecommendedWorkers = getInstallWorkersAction;
