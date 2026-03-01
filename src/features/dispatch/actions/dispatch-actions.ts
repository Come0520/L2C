"use server";

import { db } from "@/shared/api/db";
import { measureTasks, installTasks } from "@/shared/api/schema/service";
import { users } from "@/shared/api/schema/infrastructure";
import { auth } from "@/shared/lib/auth";
import { AuditService } from "@/shared/lib/audit-service";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * 包装 AuditContext (此处采用 any 退避外部强依赖，配合 AuditService 要求的格式)
 */
function createAuditContext(userId: string, tenantId: string): any {
    return {
        userId,
        tenantId,
        ip: "127.0.0.1",
        userAgent: "Dispatch Action",
        path: "/dispatch",
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
    if (!session?.user?.tenantId) throw new Error("未授权访问");

    const { tenantId, id: currentUserId } = session.user;

    // 1. 验证工人是否属于本租户
    const workerExists = await db.query.users.findFirst({
        where: and(eq(users.id, workerId), eq(users.tenantId, tenantId)),
    });

    if (!workerExists) {
        throw new Error("目标工人不存在或不属于当前租户");
    }

    // 2. 更新任务，强制带上 tenantId 隔离
    const [updatedTask] = await db
        .update(measureTasks)
        .set({
            assignedWorkerId: workerId,
            status: "DISPATCHING",
            updatedAt: new Date(),
        })
        .where(and(eq(measureTasks.id, taskId), eq(measureTasks.tenantId, tenantId)))
        .returning();

    if (!updatedTask) {
        throw new Error("测量任务不存在或无权限修改");
    }

    // 3. 记录审计
    await AuditService.recordFromSession(
        createAuditContext(currentUserId, tenantId),
        "measure_tasks",
        taskId,
        "UPDATE",
        {
            changed: { assignedWorkerId: workerId, status: "DISPATCHING" },
        }
    );

    revalidatePath("/dispatch");
    return { success: true, taskId: updatedTask.id };
}

/**
 * [安全加固] 更新测量任务状态
 */
export async function updateMeasureTaskStatus(taskId: string, status: "PENDING_APPROVAL" | "PENDING" | "DISPATCHING" | "PENDING_VISIT" | "PENDING_CONFIRM" | "COMPLETED" | "CANCELLED") {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("未授权访问");

    const { tenantId, id: currentUserId } = session.user;

    const [updatedTask] = await db
        .update(measureTasks)
        .set({
            status,
            ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
            updatedAt: new Date(),
        })
        .where(and(eq(measureTasks.id, taskId), eq(measureTasks.tenantId, tenantId)))
        .returning();

    if (!updatedTask) {
        throw new Error("测量任务不存在或无权限修改");
    }

    await AuditService.recordFromSession(
        createAuditContext(currentUserId, tenantId),
        "measure_tasks",
        taskId,
        "UPDATE",
        {
            changed: { status },
        }
    );

    revalidatePath("/dispatch");
    return { success: true, taskId: updatedTask.id };
}

// ============================================================================
// INSTALL TASKS (安装任务调度)
// ============================================================================

/**
 * [安全加固] 指派安装工人
 */
export async function assignInstallWorker(taskId: string, installerId: string, scheduledDate?: Date) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("未授权访问");

    const { tenantId, id: currentUserId } = session.user;

    // 1. 验证工人是否属于本租户
    const workerExists = await db.query.users.findFirst({
        where: and(eq(users.id, installerId), eq(users.tenantId, tenantId)),
    });

    if (!workerExists) {
        throw new Error("目标安装工人不存在或不属于当前租户");
    }

    const [updatedTask] = await db
        .update(installTasks)
        .set({
            installerId,
            status: "DISPATCHING",
            dispatcherId: currentUserId,
            assignedAt: new Date(),
            ...(scheduledDate ? { scheduledDate } : {}),
            updatedAt: new Date(),
        })
        .where(and(eq(installTasks.id, taskId), eq(installTasks.tenantId, tenantId)))
        .returning();

    if (!updatedTask) {
        throw new Error("安装任务不存在或无权限修改");
    }

    await AuditService.recordFromSession(
        createAuditContext(currentUserId, tenantId),
        "install_tasks",
        taskId,
        "UPDATE",
        {
            changed: { installerId, status: "DISPATCHING" },
        }
    );

    revalidatePath("/dispatch");
    return { success: true, taskId: updatedTask.id };
}

/**
 * [安全加固] 更新安装任务状态
 */
export async function updateInstallTaskStatus(taskId: string, status: "PENDING_DISPATCH" | "DISPATCHING" | "PENDING_VISIT" | "PENDING_CONFIRM" | "COMPLETED") {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("未授权访问");

    const { tenantId, id: currentUserId } = session.user;

    const [updatedTask] = await db
        .update(installTasks)
        .set({
            status,
            ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
            updatedAt: new Date(),
        })
        .where(and(eq(installTasks.id, taskId), eq(installTasks.tenantId, tenantId)))
        .returning();

    if (!updatedTask) {
        throw new Error("安装任务不存在或无权限修改");
    }

    await AuditService.recordFromSession(
        createAuditContext(currentUserId, tenantId),
        "install_tasks",
        taskId,
        "UPDATE",
        {
            changed: { status },
        }
    );

    revalidatePath("/dispatch");
    return { success: true, taskId: updatedTask.id };
}
