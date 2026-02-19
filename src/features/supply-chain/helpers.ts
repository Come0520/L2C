/**
 * 供应链模块辅助函数
 * 统一错误处理和通用操作
 */

import { Session } from 'next-auth';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { SUPPLY_CHAIN_ERRORS } from './constants';

/**
 * 权限检查结果类型
 */
type PermissionCheckResult<T = Session> =
    | { success: true; session: T }
    | { success: false; error: string };

/**
 * 检查用户认证状态
 * @returns 认证结果，包含 session 或错误信息
 */
export async function requireAuth(): Promise<PermissionCheckResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: SUPPLY_CHAIN_ERRORS.UNAUTHORIZED };
    }
    return { success: true, session };
}

/**
 * 检查采购单管理权限
 * @param session 用户会话
 * @returns 权限检查结果
 */
export async function requirePOManagePermission(session: Session): Promise<{ success: boolean; error?: string }> {
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);
        return { success: true };
    } catch {
        return { success: false, error: SUPPLY_CHAIN_ERRORS.NO_PO_PERMISSION };
    }
}

/**
 * 检查供应链查看权限
 * @param session 用户会话
 * @returns 权限检查结果
 */
export async function requireViewPermission(session: Session): Promise<{ success: boolean; error?: string }> {
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);
        return { success: true };
    } catch {
        return { success: false, error: SUPPLY_CHAIN_ERRORS.NO_VIEW_PERMISSION };
    }
}

/**
 * 检查供应链管理权限
 * @param session 用户会话
 * @returns 权限检查结果
 */
export async function requireManagePermission(session: Session): Promise<{ success: boolean; error?: string }> {
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);
        return { success: true };
    } catch {
        return { success: false, error: SUPPLY_CHAIN_ERRORS.NO_MANAGE_PERMISSION };
    }
}
