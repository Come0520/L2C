import { NextResponse } from 'next/server';
import { auth } from '@/shared/lib/auth';
import { WorkbenchService } from '@/services/workbench.service';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('WorkbenchTodosAPI');

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
        logger.error('获取待办事项失败', {}, error);
        return NextResponse.json(
            { error: '获取待办事项失败' },
            { status: 500 }
        );
    }
}
