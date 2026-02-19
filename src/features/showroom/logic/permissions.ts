import { Session } from 'next-auth';

/**
 * 检查用户是否有权管理指定的展厅素材
 * 权限规则：
 * 1. 管理员 (带有 ADMIN 或 SUPER_ADMIN 权限) 可管理所有素材
 * 2. 普通用户仅能管理自己创建的素材
 * 
 * @param session 当前用户 Session
 * @param createdBy 素材创建者 ID
 * @returns 是否有权管理
 */
export async function canManageShowroomItem(session: Session | null, createdBy: string) {
    if (!session?.user?.id) return false;

    // 超级管理员或管理员直接允许
    if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
        return true;
    }

    // 仅限创建者自己
    return session.user.id === createdBy;
}
