import { NextResponse } from 'next/server';
import { auth } from '@/shared/lib/auth';
import { WorkbenchService } from '@/services/workbench.service';

/**
 * GET /api/workbench/todos
 * 获取当前用户的全部待办事项
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) {
            return NextResponse.json(
                { error: '未授权' },
                { status: 401 }
            );
        }

        const todos = await WorkbenchService.getUnifiedTodos(
            session.user.tenantId,
            session.user.id,
            session.user.roles || []
        );

        return NextResponse.json(todos);
    } catch (error) {
        console.error('[工作台待办] 获取失败:', error);
        return NextResponse.json(
            { error: '获取待办事项失败' },
            { status: 500 }
        );
    }
}
