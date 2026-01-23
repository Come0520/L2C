/**
 * 查询租户审批状态 API
 * 
 * GET /api/miniprogram/tenant/status
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// 从 Token 获取用户信息
async function getUserFromToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as { userId: string; tenantId: string };
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const tokenData = await getUserFromToken(request);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, error: '未授权' },
                { status: 401 }
            );
        }

        // 获取租户信息
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tokenData.tenantId),
        });

        if (!tenant) {
            return NextResponse.json(
                { success: false, error: '租户不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                status: tenant.status,
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    code: tenant.code,
                    applicantName: tenant.applicantName,
                    applicantPhone: tenant.applicantPhone,
                    applicantEmail: tenant.applicantEmail,
                    region: tenant.region,
                    businessDescription: tenant.businessDescription,
                    rejectReason: tenant.rejectReason,
                    createdAt: tenant.createdAt,
                    reviewedAt: tenant.reviewedAt,
                },
            },
        });

    } catch (error) {
        console.error('查询状态错误:', error);
        return NextResponse.json(
            { success: false, error: '查询失败' },
            { status: 500 }
        );
    }
}
