/**
 * 生成员工邀请码 API
 *
 * POST /api/miniprogram/invite/generate
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants, invitations } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { customAlphabet } from 'nanoid';

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

export async function POST(request: NextRequest) {
  try {
    const tokenData = await getUserFromToken(request);

    if (!tokenData) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    // 检查租户是否已激活
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tokenData.tenantId),
    });

    if (!tenant || tenant.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '企业未激活，无法邀请员工' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role = 'SALES', roles } = body;
    // 兼容处理：如果前端传了 roles 数组则使用，否则回退到单 role
    const targetRoles = roles && roles.length > 0 ? roles : [role];
    const maxUses = body.maxUses || '1'; // 默认单次有效

    // 生成6位数字邀请码 (方便输入)
    const generateCode = customAlphabet('0123456789', 6);
    const inviteCode = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天有效期

    // 保存到数据库
    await db.insert(invitations).values({
      tenantId: tokenData.tenantId,
      inviterId: tokenData.userId,
      code: inviteCode,
      role,
      expiresAt,
      maxUses: String(maxUses),
      isActive: true,
    });

    // 生成邀请 Token
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const inviteToken = await new SignJWT({
      type: 'employee_invite',
      tenantId: tokenData.tenantId,
      inviterId: tokenData.userId,
      defaultRole: targetRoles[0], // 保持向后兼容
      defaultRoles: targetRoles, // 新增多角色支持
      inviteCode,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(secret);

    // 邀请链接（Web 端）
    const baseUrl = process.env.AUTH_URL || 'https://your-domain.com';
    const inviteLink = `${baseUrl}/register/employee?token=${inviteToken}`;

    // 小程序码 URL（Mock Implementation）
    // 使用公共 HTTPS 二维码生成服务，确保小程序可以加载
    const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteLink)}`;

    return NextResponse.json({
      success: true,
      data: {
        inviteCode,
        inviteLink,
        qrcodeUrl,
        expiresAt: expiresAt.toISOString(),
        role,
      },
    });
  } catch (error) {
    console.error('生成邀请码错误:', error);
    return NextResponse.json({ success: false, error: '生成失败' }, { status: 500 });
  }
}
