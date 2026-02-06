import { NextResponse } from 'next/server';
import { auth } from '@/shared/lib/auth';

/**
 * 获取当前登录用户信息
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
            tenantId: session.user.tenantId,
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return NextResponse.json(
            { error: '获取用户信息失败' },
            { status: 500 }
        );
    }
}
