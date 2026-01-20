
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';
import { compare } from 'bcryptjs';

/**
 * 移动端登录接口
 * POST /api/mobile/auth/login
 * 
 * @body { phone: string, password: string }
 * @returns { success: boolean, data: { accessToken, refreshToken, user } }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        // 参数校验
        if (!phone || !password) {
            return NextResponse.json(
                { success: false, message: '手机号或密码不能为空' },
                { status: 400 }
            );
        }

        // 查找用户
        const user = await db.query.users.findFirst({
            where: and(
                eq(users.phone, phone),
                eq(users.isActive, true)
            )
        });

        // 安全修复：统一返回模糊错误信息，防止用户枚举攻击
        if (!user || !user.passwordHash) {
            return NextResponse.json(
                { success: false, message: '手机号或密码错误' },
                { status: 401 }
            );
        }

        // 安全修复：验证密码哈希
        const passwordsMatch = await compare(password, user.passwordHash);
        if (!passwordsMatch) {
            return NextResponse.json(
                { success: false, message: '手机号或密码错误' },
                { status: 401 }
            );
        }

        // 生成 JWT Token
        const userPhone = user.phone || phone; // 使用登录时的手机号作为备用
        const accessToken = await generateAccessToken(user.id, user.tenantId, userPhone);
        const refreshToken = await generateRefreshToken(user.id, user.tenantId, userPhone);

        return NextResponse.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                expiresIn: 86400, // 24小时（秒）
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    avatar: user.avatarUrl,
                    tenantId: user.tenantId,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('移动端登录错误:', error);
        return NextResponse.json(
            { success: false, message: '服务器内部错误' },
            { status: 500 }
        );
    }
}

