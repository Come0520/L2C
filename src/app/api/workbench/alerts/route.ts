import { NextResponse } from 'next/server';
import { auth } from '@/shared/lib/auth';
import { WorkbenchService } from '@/services/workbench.service';

/**
 * GET /api/workbench/alerts
 * 获取当前租户的报警信息
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: '未授权' },
                { status: 401 }
            );
        }

        // 角色权限校验：仅 ADMIN, MANAGER, FINANCE 可访问全局报警
        const allowedRoles = ['ADMIN', 'MANAGER', 'FINANCE'];
        const userRoles = session.user.roles || [];
        const hasPermission = userRoles.some(role => allowedRoles.includes(role)) || allowedRoles.includes(session.user.role || '');

        if (!hasPermission) {
            return NextResponse.json(
                { error: '权限不足' },
                { status: 403 }
            );
        }

        const alerts = await WorkbenchService.getAlerts(
            session.user.tenantId
        );

        return NextResponse.json(alerts);
    } catch (error) {
        console.error('[工作台报警] 获取失败:', error);
        return NextResponse.json(
            { error: '获取报警信息失败' },
            { status: 500 }
        );
    }
}
