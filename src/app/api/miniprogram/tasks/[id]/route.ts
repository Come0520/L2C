/**
 * 任务详情 API
 * 
 * GET /api/miniprogram/tasks/[id]
 * 获取特定任务的详细信息
 * 
 * POST /api/miniprogram/tasks/[id]
 * 更新任务状态或上传信息
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks, customers, measureSheets, measureItems } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

/**
 * Helper: Parse User from Token
 */
async function getUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.slice(7);
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return {
            id: payload.userId as string,
            tenantId: payload.tenantId as string,
            role: payload.role as string,
        };
    } catch {
        return null;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Next.js 15+ params is async
) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'measure' or 'install'

        if (!type) {
            return NextResponse.json({ success: false, error: '缺少任务类型参数' }, { status: 400 });
        }

        let taskData = null;

        if (type === 'measure') {
            const task = await db.query.measureTasks.findFirst({
                where: and(
                    eq(measureTasks.id, id),
                    eq(measureTasks.tenantId, user.tenantId)
                ),
                with: {
                    customer: true, // Assuming relation exists in schema definition for query builder, otherwise manual join needed
                }
            });

            // Manual join if relations aren't fully set up in runtime schema object for query builder
            // But we can fallback to standard queries if needed. 
            // Let's use simple queries for safety to ensure all data is fetched.

            const rawTask = await db.select().from(measureTasks).where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId))).limit(1);
            if (!rawTask.length) return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });

            const t = rawTask[0];

            // Fetch Customer
            const customer = await db.select().from(customers).where(eq(customers.id, t.customerId)).limit(1);

            // Fetch Measure Sheets (if any)
            const sheets = await db.select().from(measureSheets).where(eq(measureSheets.taskId, t.id));

            taskData = {
                ...t,
                customer: customer[0],
                sheets: sheets
            };
        } else if (type === 'install') {
            const rawTask = await db.select().from(installTasks).where(and(eq(installTasks.id, id), eq(installTasks.tenantId, user.tenantId))).limit(1);
            if (!rawTask.length) return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });

            taskData = {
                ...rawTask[0]
            };
        }

        return NextResponse.json({
            success: true,
            data: taskData
        });

    } catch (error) {
        console.error('Get Task Detail Error:', error);
        return NextResponse.json({ success: false, error: '获取详情失败' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { type, action, data } = body;
        // action: 'update_status', 'check_in', 'complete', 'upload_photo'

        if (type === 'measure') {
            if (action === 'update_status') {
                await db.update(measureTasks)
                    .set({ status: data.status, updatedAt: new Date() })
                    .where(eq(measureTasks.id, id));
            }
            // Add more actions as needed
        } else if (type === 'install') {
            if (action === 'update_status') {
                await db.update(installTasks)
                    .set({ status: data.status, updatedAt: new Date() })
                    .where(eq(installTasks.id, id));
            }
        }

        return NextResponse.json({ success: true, message: '更新成功' });

    } catch (error) {
        console.error('Update Task Error:', error);
        return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }
}
