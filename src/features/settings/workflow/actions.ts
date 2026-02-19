'use server';

import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

/**
 * 工作流管理 Actions - 占位实现
 *
 * @todo [P3] 待工作流模块正式开发后，替换占位函数为实际数据库操作和业务逻辑。
 * 当前 createWorkflow / updateWorkflow / deleteWorkflow 仅做权限校验，不执行持久化。
 */

interface WorkflowData {
    name?: string;
    description?: string;
    steps?: { name: string; assignee: string }[];
}

export async function getWorkflows() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }
    return { success: true, data: [] };
}

export async function createWorkflow(_data: WorkflowData) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }
    // 权限校验：需要设置管理权限
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    return { success: true, message: 'Workflow created' };
}

export async function updateWorkflow(_data: WorkflowData & { id?: string }) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }
    // 权限校验：需要设置管理权限
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    return { success: true, message: 'Workflow updated' };
}

export async function deleteWorkflow(_id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }
    // 权限校验：需要设置管理权限
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    return { success: true, message: 'Workflow deleted' };
}
