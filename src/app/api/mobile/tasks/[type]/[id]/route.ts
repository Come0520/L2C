
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

function getWorkerIdFromHeader(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mk_')) return null;
    const token = authHeader.split(' ')[1];
    const parts = token.split('_');
    if (parts.length >= 2) return parts[1];
    return null;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    try {
        const { type, id } = await params;
        const workerId = getWorkerIdFromHeader(request);
        if (!workerId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        let data = null;

        if (type === 'measure') {
            data = await db.query.measureTasks.findFirst({
                where: and(eq(measureTasks.id, id), eq(measureTasks.assignedWorkerId, workerId)),
                with: {
                    customer: true,
                    lead: true
                }
            });
        } else if (type === 'install') {
            data = await db.query.installTasks.findFirst({
                where: and(eq(installTasks.id, id), eq(installTasks.installerId, workerId)),
                with: {
                    customer: true,
                    order: true,
                    items: true
                }
            });
        }

        if (!data) {
            return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });

    } catch {
        return NextResponse.json({ success: false, message: 'Error fetching task' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    try {
        const { type, id } = await params;
        const workerId = getWorkerIdFromHeader(request);
        if (!workerId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { action, checkInLocation, images, resultData } = body;
        // action: 'CHECK_IN' | 'SUBMIT'

        const now = new Date();

        if (type === 'measure') {
            if (action === 'CHECK_IN') {
                await db.update(measureTasks)
                    .set({ checkInAt: now, checkInLocation })
                    .where(eq(measureTasks.id, id));
            } else if (action === 'SUBMIT') {
                await db.update(measureTasks)
                    .set({
                        status: 'COMPLETED',
                        // resultData, // Schema has no resultData
                        // images, // Schema has no images
                        updatedAt: now
                    })
                    .where(eq(measureTasks.id, id));
            }
        } else if (type === 'install') {
            if (action === 'CHECK_IN') {
                await db.update(installTasks)
                    .set({ checkInAt: now, checkInLocation })
                    .where(eq(installTasks.id, id));
            } else if (action === 'SUBMIT') {
                await db.update(installTasks)
                    .set({ status: 'COMPLETED', completedAt: now })
                    .where(eq(installTasks.id, id));
            }
        }

        return NextResponse.json({ success: true });

    } catch {
        console.error('Update failed');
        return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
    }
}
