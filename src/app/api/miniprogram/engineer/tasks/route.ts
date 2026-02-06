import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Helper: Get User Info
async function getUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.slice(7);
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, payload.userId as string),
            columns: { id: true, role: true, tenantId: true },
        });
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch tasks assigned to this user (installer)
        const list = await db.query.installTasks.findMany({
            where: and(
                eq(installTasks.tenantId, user.tenantId),
                eq(installTasks.installerId, user.id)
            ),
            orderBy: [desc(installTasks.scheduledDate), desc(installTasks.createdAt)],
            with: {
                items: true
            }
        });

        return NextResponse.json({ success: true, data: list });

    } catch (error) {
        console.error('Get Tasks Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
