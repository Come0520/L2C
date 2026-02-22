import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { invitations, users } from '@/shared/api/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { getMiniprogramUser } from '../../auth-utils';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';



export async function GET(request: NextRequest) {
  try {
    const tokenData = await getMiniprogramUser(request);
    if (!tokenData) {
      return apiError('未授权', 401);
    }

    const { tenantId } = tokenData;

    // 1. 获取已加入的用户
    const joinedUsers = await db.query.users.findMany({
      where: eq(users.tenantId, tenantId),
      orderBy: [desc(users.createdAt)],
    });

    // 2. 获取待接受的邀请
    const pendingInvites = await db.query.invitations.findMany({
      where: and(
        eq(invitations.tenantId, tenantId),
        eq(invitations.isActive, true),
        gt(invitations.expiresAt, new Date())
      ),
      orderBy: [desc(invitations.createdAt)],
    });

    // 3. 合并列表
    const list = [];

    // 添加已加入用户 (过滤掉自己? 暂时不过滤)
    for (const user of joinedUsers) {
      list.push({
        id: user.id,
        name: user.name || '微信用户',
        phone: user.phone || '未绑定', // user schema has phone?
        roleName: getRoleName(user.role),
        joinTime: user.createdAt,
        status: 'joined',
        createdAt: user.createdAt,
      });
    }

    // 添加待接受邀请
    for (const invite of pendingInvites) {
      // 简单判断: 如果该邀请码已经被用过 (如果实现了 usedCount)，这里暂时假设未用完
      // 或者前端 accept 成功后，邀请码若设置单次有效应失效。
      // 这里简单展示所有有效期的邀请码
      list.push({
        id: invite.id,
        name: '待邀请',
        phone: '-', // 邀请码模式不知道手机号
        roleName: getRoleName(invite.role),
        joinTime: invite.createdAt, // 展示创建时间
        status: 'pending',
        inviteCode: invite.code,
        createdAt: invite.createdAt,
      });
    }

    // 排序
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return apiSuccess(list);
  } catch (error) {
    logger.error('获取邀请列表失败:', error);
    return apiError('获取失败', 500);
  }
}

function getRoleName(role: string | null) {
  const roles: Record<string, string> = {
    ADMIN: '管理员',
    MANAGER: '经理',
    SALES: '销售员',
    FINANCE: '财务',
    SUPPLY: '供应链',
    DISPATCHER: '调度员',
    WORKER: '工人',
    CUSTOMER: '客户',
  };
  return role ? roles[role] || role : '未知';
}
