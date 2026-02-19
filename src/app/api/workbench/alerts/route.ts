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
