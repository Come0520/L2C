import { db } from '@/shared/api/db';
import { installTasks, users } from '@/shared/api/schema';
import { eq, and, desc, like, inArray } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidatePath, unstable_cache } from 'next/cache';
import { PERMISSIONS } from '@/shared/config/permissions';

// Helper: Get Session
async function getSession() {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        throw new Error('Unauthorized');
    }
    return session;
}

/**
 * 获取安装任务列表
 * @param filters - 包含状态(status)与搜索关键字(search)等过滤条件的对象
 * @returns 包含操作成功状态和安装任务数组列表的响应对象
 */
export async function getInstallTasks(filters?: { status?: string; search?: string }) {
    try {
        const session = await getSession();
        const { status, search } = filters || {};

        const list = await db.query.installTasks.findMany({
            where: and(
                eq(installTasks.tenantId, session.user.tenantId),
                search ? like(installTasks.taskNo, `%${search}%`) : undefined,
                status && status !== 'ALL' ? eq(installTasks.status, status as typeof installTasks.$inferSelect['status']) : undefined
            ),
            with: {
                installer: true,
                items: true
            },
            orderBy: [desc(installTasks.createdAt)]
        });
        return { success: true, data: list };
    } catch {
        return { success: false, data: [] };
    }
}

const getCachedInstallers = unstable_cache(
    async (tenantId: string) => {
        return await db.query.users.findMany({
            where: and(
                eq(users.tenantId, tenantId),
                inArray(users.role, ['WORKER', 'INSTALLER'])
            ),
            columns: { id: true, name: true, role: true }
        });
    },
    ['installers-list'],
    { tags: ['users', 'installers'] }
);

/**
 * 获取可用的安装师傅列表
 * 缓存结果以优化频繁访问，受基于角色的资源隔离约束
 * @returns 包含操作成功状态与师傅详细信息数组的响应对象
 */
export async function getInstallers() {
    try {
        const session = await getSession();
        const list = await getCachedInstallers(session.user.tenantId);
        return { success: true, data: list };
    } catch {
        return { success: false, data: [] };
    }
}

/**
 * 将特定的安装单明确指派给某个安装师傅并设定时间
 * @param data - 操作的有效载荷
 * @param data.taskId - 待分配的安装任务 ID
 * @param data.installerId - 目标安装师傅的 UUID
 * @param data.scheduledDate - ISO 格式的预定安装日期字符串
 * @param data.scheduledTimeSlot - 指派的上门时间段标识（如上/下午）
 * @returns 包含操作成功状态与可能的异常报错信息的实例对象
 */
export async function dispatchInstallTask(data: {
    taskId: string;
    installerId: string;
    scheduledDate: string; // ISO string
    scheduledTimeSlot: string;
}) {
    try {
        const session = await getSession();
        // P0-3 Fix: Add permission check
        await checkPermission(session, PERMISSIONS.INSTALL.MANAGE);

        const { taskId, installerId, scheduledDate, scheduledTimeSlot } = data;

        // 【防御性逻辑】：防范将任务派发给无效的/不存在的师傅，或简单检查该用户是否是师傅
        const installerMeta = await db.query.users.findFirst({
            where: and(
                eq(users.id, installerId),
                eq(users.tenantId, session.user.tenantId),
                inArray(users.role, ['WORKER', 'INSTALLER'])
            )
        });

        if (!installerMeta) {
            return { success: false, error: '指定的安装师傅不存在或状态不可用' };
        }

        await db.update(installTasks)
            .set({
                installerId,
                scheduledDate: new Date(scheduledDate),
                scheduledTimeSlot,
                status: 'PENDING_ACCEPT', // Or PENDING_START if no accept flow
                dispatcherId: session.user.id,
                assignedAt: new Date(),
                updatedAt: new Date()
            })
            .where(and(eq(installTasks.id, taskId), eq(installTasks.tenantId, session.user.tenantId)));

        revalidatePath('/projects');
        revalidatePath(`/projects/${taskId}`);
        return { success: true };

    } catch {
        return { success: false, error: 'Dispatch Failed' };
    }
}
