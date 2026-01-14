
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        // Validation
        if (!phone || !password) {
            return NextResponse.json(
                { success: false, message: 'Missing phone or password' },
                { status: 400 }
            );
        }

        // Find user
        // Note: Password check is mocked for now as we don't have hash verify logic exposed yet 
        // or user might not have password set. 
        // In real app, verify `passwordHash`.
        const user = await db.query.users.findFirst({
            where: and(
                eq(users.phone, phone),
                eq(users.isActive, true)
            )
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Mock Token generation (simulating a Bearer token)
        // In production, sign a JWT here.
        const mockToken = `mk_${user.id}_${Date.now()}`;

        return NextResponse.json({
            success: true,
            data: {
                token: mockToken,
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    avatar: user.avatarUrl,
                    tenantId: user.tenantId
                }
            }
        });

    } catch (error) {
        console.error('Mobile Login Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
