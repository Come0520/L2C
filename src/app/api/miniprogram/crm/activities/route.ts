import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { customerActivities, users } from '@/shared/api/schema';
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

        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
        }

        const list = await db.query.customerActivities.findMany({
            where: and(
                eq(customerActivities.customerId, customerId),
                eq(customerActivities.tenantId, user.tenantId)
            ),
            orderBy: [desc(customerActivities.createdAt)],
            with: {
                creator: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: list });

    } catch (error) {
        console.error('Get Activities Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { customerId, type, description, images, location } = body;

        if (!customerId || !type || !description) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const [newActivity] = await db.insert(customerActivities).values({
            tenantId: user.tenantId,
            customerId,
            type,
            description,
            images: images || [],
            location: location || null,
            createdBy: user.id
        }).returning();

        return NextResponse.json({ success: true, data: newActivity });

    } catch (error) {
        console.error('Create Activity Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
