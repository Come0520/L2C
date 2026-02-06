import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { customers, customerActivities, users } from '@/shared/api/schema';
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const customerId = await Promise.resolve(params.id);

        const customer = await db.query.customers.findFirst({
            where: and(eq(customers.id, customerId), eq(customers.tenantId, user.tenantId)),
            with: {
                assignedSales: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
        }

        // Get recent activities
        const recentActivities = await db.query.customerActivities.findMany({
            where: eq(customerActivities.customerId, customerId),
            orderBy: [desc(customerActivities.createdAt)],
            limit: 5,
            with: {
                creator: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...customer,
                activities: recentActivities
            }
        });

    } catch (error) {
        console.error('Get Customer Detail Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
