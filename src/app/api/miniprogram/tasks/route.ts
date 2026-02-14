/**
 * 小程序任务列表 API
 *
 * GET /api/miniprogram/tasks
 * 返回当前用户（师傅）的任务列表
 *
 * Query Params:
 * - type: 'measure' | 'install' | 'all' (默认 'all')
 * - status: 任务状态过滤
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks, customers, leads } from '@/shared/api/schema';
import { eq, and, or, desc, inArray } from 'drizzle-orm';
import { jwtVerify } from 'jose';

/**
 * 从 JWT Token 中解析用户信息
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

export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';
        const statusFilter = searchParams.get('status');

        const result: {
            measureTasks: any[];
            installTasks: any[];
        } = {
            measureTasks: [],
            installTasks: [],
        };

        // 获取测量任务（分配给当前用户的）
        if (type === 'all' || type === 'measure') {
            const measureQuery = db
                .select({
                    id: measureTasks.id,
                    measureNo: measureTasks.measureNo,
                    status: measureTasks.status,
                    scheduledAt: measureTasks.scheduledAt,
                    type: measureTasks.type,
                    remark: measureTasks.remark,
                    createdAt: measureTasks.createdAt,
                    // 关联客户信息
                    customerName: customers.name,
                    customerPhone: customers.phone,
                })
                .from(measureTasks)
                .leftJoin(customers, eq(measureTasks.customerId, customers.id))
                .where(
                    and(
                        eq(measureTasks.tenantId, user.tenantId),
                        eq(measureTasks.assignedWorkerId, user.id),
                        statusFilter
                            ? eq(measureTasks.status, statusFilter as any)
                            : or(
                                eq(measureTasks.status, 'PENDING'),
                                eq(measureTasks.status, 'PENDING_VISIT'),
                                eq(measureTasks.status, 'PENDING_CONFIRM')
                            )
                    )
                )
                .orderBy(desc(measureTasks.scheduledAt));

            result.measureTasks = await measureQuery;
        }

        // 获取安装任务（分配给当前用户的）
        if (type === 'all' || type === 'install') {
            const installQuery = db
                .select({
                    id: installTasks.id,
                    taskNo: installTasks.taskNo,
                    status: installTasks.status,
                    category: installTasks.category,
                    scheduledDate: installTasks.scheduledDate,
                    scheduledTimeSlot: installTasks.scheduledTimeSlot,
                    remark: installTasks.remark,
                    notes: installTasks.notes,
                    createdAt: installTasks.createdAt,
                    // 客户信息（直接存储在任务表中）
                    customerName: installTasks.customerName,
                    customerPhone: installTasks.customerPhone,
                    address: installTasks.address,
                })
                .from(installTasks)
                .where(
                    and(
                        eq(installTasks.tenantId, user.tenantId),
                        eq(installTasks.installerId, user.id),
                        statusFilter
                            ? eq(installTasks.status, statusFilter as any)
                            : or(
                                eq(installTasks.status, 'PENDING_DISPATCH'),
                                eq(installTasks.status, 'PENDING_VISIT'),
                                eq(installTasks.status, 'PENDING_CONFIRM')
                            )
                    )
                )
                .orderBy(desc(installTasks.scheduledDate));

            result.installTasks = await installQuery;
        }

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('获取任务列表失败:', error);
        return NextResponse.json(
            { success: false, error: '获取任务列表失败' },
            { status: 500 }
        );
    }
}
