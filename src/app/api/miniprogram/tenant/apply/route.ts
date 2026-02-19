/**
 * 小程序租户申请 API
 * 
 * POST /api/miniprogram/tenant/apply - 提交入驻申请
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq, or } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { apiSuccess, apiError } from '@/shared/lib/api-response';

import { z } from 'zod';

// 定义注册 Schema
const RegisterSchema = z.object({
    companyName: z.string().min(2, '公司名称至少2个字符').max(100, '公司名称过长'),
    applicantName: z.string().min(2, '联系人姓名至少2个字符').max(50, '联系人姓名过长'),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
    email: z.string().email('邮箱格式不正确'),
    region: z.string().min(2, '请选择地区'),
    password: z.string().min(8, '密码至少8位').max(32, '密码过长'),
    businessDescription: z.string().optional(),
    openId: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. Zod 安全校验
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
            return apiError(validation.error.issues[0].message, 400);
        }

        const {
            companyName,
            applicantName,
            phone,
            email,
            region,
            password,
            businessDescription,
            openId,
        } = validation.data;

        // 2. 深度检查手机号/邮箱是否已存在 (防御重复注册)
        const existingUser = await db.query.users.findFirst({
            where: or(
                eq(users.phone, phone),
                eq(users.email, email)
            ),
        });

        if (existingUser) {
            return apiError('该手机号或邮箱已被注册，请直接登录', 400);
        }

        // 3. 生成唯一租户代码 (高强度 ID)
        const tenantCode = `T${nanoid(10).toUpperCase()}`;

        // 4. 原子性事务创建
        const result = await db.transaction(async (tx) => {
            // 创建待审批租户
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

            // 创建 BOSS 用户 (默认禁用)
            const passwordHash = await hash(password, 12);
            const [newUser] = await tx.insert(users).values({
                tenantId: newTenant.id,
                name: applicantName,
                phone,
                email,
                passwordHash,
                role: 'BOSS',
                isActive: false,
                wechatOpenId: openId || null,
                permissions: [],
            }).returning();

            return { tenant: newTenant, user: newUser };
        });

        // 5. 签发受限 Token (针对未激活用户仅 24 小时有效期)
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const token = await new SignJWT({
            userId: result.user.id,
            tenantId: result.tenant.id,
            type: 'miniprogram_pending', // 标记为待审批类型
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h') // 相比原先的 30d，此时长更符合安全规范
            .sign(secret);

        return apiSuccess({
            tenantId: result.tenant.id,
            user: {
                id: result.user.id,
                name: result.user.name,
                phone: result.user.phone,
                role: result.user.role,
                tenantStatus: 'pending_approval',
            },
            token,
        });

    } catch (error) {
        console.error('租户申请错误:', error);
        return apiError(error instanceof Error ? error.message : '提交失败', 500);
    }
}
