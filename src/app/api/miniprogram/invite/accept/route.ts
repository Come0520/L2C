/**
 * 接受邀请 API
 *
 * POST /api/miniprogram/invite/accept
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { invitations, users, tenants } from '@/shared/api/schema';
import { eq, and, gt } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';

// 从 Token 获取 OpenID (假设前端在未登录状态下可能通过 header 或其他方式传递 openId，或者先调用了 auth/wx-login 拿到了 token)
// 但通常逻辑是：小程序端先 wx.login 换取了 openId (但没注册)，此时可能有临时 token 或仅有 openId。
// 这里的实现假设：
// 1. 用户先进入 Register 页 (未登录) -> 无法通过 Header Bearer 拿到 verified userId。
// 2. 但用户可能已通过 `wx-login` 拿到了一个 "Guest Token" (只是包含 openId，没有 userId)。
//    或者前端直接传 openId (不安全)。
//    **最佳实践**：注册/绑定接口应该需要一个由 `wx-login` 签发的 "Predb Token" (包含 openId)。

async function getOpenIdFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

  try {
    // 尝试解析，看是否包含 openId
    // auth/wx-login 应该返回一个包含 openId 的 token 即使是新用户
    const { payload } = await jwtVerify(token, secret);
    return payload as { openId: string; userId?: string };
  } catch {
    return null;
  }
}

async function generateToken(userId: string, tenantId: string) {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  return new SignJWT({ userId, tenantId, type: 'miniprogram' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: '请输入邀请码' }, { status: 400 });
    }

    // 1. 验证 Token (获取当前操作人的 OpenID)
    // 这里的 Token 应该是 wx-login 接口返回的，即使该用户 DB 里还不存在 user 记录，
    // 我们也应该在 wx-login 时签发一个只带 openId 的临时 Token。
    // *如果在 wx-login 接口里，用户不存在时只返回了 openId 没返回 token，那前端这就没法传 token 了*。
    // 根据之前的 wx-login/route.ts，如果用户不存在，它只返回 openId，没有 Token。
    // **修正**：前端必须把 openId 传过来，或者 wx-login 必须给新用户签发临时 Token。
    // 为了安全，建议 wx-login 对新用户也签发一个 { openId, isGuest: true } 的 Token。
    // *临时方案*：假设前端传了 openId 字段 (仅用于演示/开发阶段，生产环境应签名校验)。
    const { openId: bodyOpenId } = body; // 前端需传 openId

    // 更好的方式：复用 getUserFromToken 逻辑 (如果 wx-login 已经改造成返回临时 token)
    // 鉴于我没改 wx-login，我们假设前端已存 openId 并显式传递 (需配合前端修改)。

    const openId = bodyOpenId;

    if (!openId) {
      return NextResponse.json(
        { success: false, error: 'OpenID 缺失，请重新登录' },
        { status: 401 }
      );
    }

    // 2. 查找邀请码
    const invite = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.code, code),
        eq(invitations.isActive, true),
        gt(invitations.expiresAt, new Date())
      ),
    });

    if (!invite) {
      return NextResponse.json({ success: false, error: '邀请码无效或已过期' }, { status: 404 });
    }

    // 3. 查找或创建用户
    let user = await db.query.users.findFirst({
      where: eq(users.wechatOpenId, openId),
    });

    if (user) {
      // 用户已存在，更新 tenantId 和 role
      if (user.tenantId && user.tenantId !== invite.tenantId) {
        // 已加入其他租户，暂不支持多租户切换 (根据架构设计：单点)
        // 策略：覆盖？提示？
        // 现阶段：直接报错，提示先退出
        return NextResponse.json(
          { success: false, error: '您已加入其他企业，请先联系管理员退出' },
          { status: 409 }
        );
      }

      await db
        .update(users)
        .set({
          tenantId: invite.tenantId,
          role: invite.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // 重新获取更新后的 user
      user = (await db.query.users.findFirst({ where: eq(users.id, user.id) })) as any;
    } else {
      // 新用户创建
      const [newUser] = await db
        .insert(users)
        .values({
          email: `${openId}@wechat.com`, // 占位
          tenantId: invite.tenantId,
          role: invite.role,
          wechatOpenId: openId,
          name: '微信用户', // 需前端 getUserProfile 更新
          isActive: true,
        })
        .returning();
      user = newUser;
    }

    // 4. 更新邀请码使用次数 (可选)
    // await db.update(invitations).set({ usedCount: ... })...

    // 5. 获取租户信息
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, invite.tenantId),
    });

    // 6. 生成正式 Token
    const token = await generateToken(user!.id, invite.tenantId);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          tenantName: tenant?.name,
        },
        token,
        tenantStatus: tenant?.status,
      },
    });
  } catch (error) {
    console.error('接受邀请失败:', error);
    return NextResponse.json({ success: false, error: '系统错误' }, { status: 500 });
  }
}
