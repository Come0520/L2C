/**
 * 小程序租户申请 API
 * 
 * POST /api/miniprogram/tenant/apply - 提交入驻申请
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq, or } from 'drizzle-orm';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            companyName,
            applicantName,
            phone,
            email,
            region,
            password,
            businessDescription,
            openId,
        } = body;

        // 验证必填字段
        if (!companyName || !applicantName || !phone || !email || !region || !password) {
            return NextResponse.json(
                { success: false, error: '请填写所有必填字段' },
                { status: 400 }
            );
        }

        // 检查手机号/邮箱是否已存在
        const existingUser = await db.query.users.findFirst({
            where: or(
                eq(users.phone, phone),
                eq(users.email, email)
            ),
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: '该手机号或邮箱已被注册' },
                { status: 400 }
            );
        }

        // 生成唯一租户代码
        const tenantCode = `T${nanoid(8).toUpperCase()}`;

        // 在事务中创建租户和用户
        const result = await db.transaction(async (tx) => {
            // 1. 创建待审批租户
            const [newTenant] = await tx.insert(tenants).values({
                name: companyName,
                code: tenantCode,
                status: 'pending_approval',
                applicantName,
                applicantPhone: phone,
                applicantEmail: email,
                region,
                businessDescription: businessDescription || null,
                isActive: false,
            }).returning();

            // 2. 创建 BOSS 用户
            const passwordHash = await hash(password, 12);
            const [newUser] = await tx.insert(users).values({
                tenantId: newTenant.id,
                name: applicantName,
                phone,
                email,
                passwordHash,
                role: 'BOSS',
                isActive: false, // 审批通过后激活
                wechatOpenId: openId || null, // 绑定微信
                permissions: [],
            }).returning();

            return { tenant: newTenant, user: newUser };
        });

        // 生成 Token
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const token = await new SignJWT({
            userId: result.user.id,
            tenantId: result.tenant.id,
            type: 'miniprogram',
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(secret);

        return NextResponse.json({
            success: true,
            data: {
                tenantId: result.tenant.id,
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    phone: result.user.phone,
                    email: result.user.email,
                    role: result.user.role,
                    tenantId: result.tenant.id,
                    tenantName: result.tenant.name,
                },
                tenantStatus: 'pending_approval',
                token,
            },
        });

    } catch (error) {
        console.error('租户申请错误:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : '提交失败' },
            { status: 500 }
        );
    }
}
