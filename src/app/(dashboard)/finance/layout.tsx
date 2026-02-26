import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/shared/config/roles';

/**
 * 财务模块统一布局
 *
 * 功能：
 * 1. 路由级权限守卫 — 检查用户是否拥有任意 finance.* 权限
 * 2. 无权限用户重定向到工作台
 */
export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // 检查用户是否拥有任意财务模块权限
    const userRoles = session.user.roles || [session.user.role || 'SALES'];
    const hasFinanceAccess = userRoles.some((roleCode: string) => {
        // ADMIN / TENANT_ADMIN 拥有全部权限
        if (roleCode === 'ADMIN' || roleCode === 'TENANT_ADMIN') return true;

        const roleDef = ROLES[roleCode];
        if (!roleDef) return false;

        // 检查该角色是否拥有以 finance. 开头的任意权限
        return (roleDef.permissions as string[]).some(
            (perm: string) => perm === '**' || perm === '*' || perm.startsWith('finance.')
        );
    });

    if (!hasFinanceAccess) {
        redirect('/dashboard');
    }

    return <>{children}</>;
}
