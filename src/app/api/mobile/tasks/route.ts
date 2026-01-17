
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Mock Auth Check Helper
// Accepts "Authorization: Bearer mk_USERID_TS"
function getWorkerIdFromHeader(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mk_')) return null;
    const token = authHeader.split(' ')[1];
    const parts = token.split('_');
    if (parts.length >= 2) return parts[1]; // Return embedded UserID
    return null;
}

export async function GET(request: Request) {
    try {
        const workerId = getWorkerIdFromHeader(request);
        if (!workerId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Fetch Measure Tasks
        const mTasks = await db.query.measureTasks.findMany({
            where: eq(measureTasks.assignedWorkerId, workerId),
            orderBy: [desc(measureTasks.scheduledAt)],
            with: {
                customer: { columns: { name: true, phone: true } },
                lead: { columns: { address: true } }
            }
        });

        // Fetch Install Tasks
        const iTasks = await db.query.installTasks.findMany({
            where: eq(installTasks.installerId, workerId),
            orderBy: [desc(installTasks.scheduledDate)],
            with: {
                customer: { columns: { name: true, phone: true } }
            }
        });

        // Normalize and Combine
        const combined = [
            ...mTasks.map(t => ({
                id: t.id,
                type: 'measure',
                docNo: t.measureNo,
                status: t.status,
                customer: t.customer,
                scheduledAt: t.scheduledAt,
                address: t.lead?.address || ''
            })),
            ...iTasks.map(t => ({
                id: t.id,
                type: 'install',
                docNo: t.taskNo,
                status: t.status,
                customer: t.customer,
                scheduledAt: t.scheduledDate,
                address: t.address || ''
            }))
        ].sort((a, b) => {
            const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
            const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
            return dateB - dateA; // Descending
        });

        return NextResponse.json({
            success: true,
            data: combined
        });

    } catch (error) {
        console.error('Mobile Task List Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
