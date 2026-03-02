/**
 * 租户公开预约 API（无需鉴权）
 *
 * @description C端用户在租户落地页填写的轻量级预约表单，直接转为对应租户的「线索 (Lead)」。
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants, leads, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/shared/lib/logger';
import { z } from 'zod';

const publicBookingSchema = z.object({
  tenantCode: z.string().min(1, '缺少租户码'),
  customerName: z.string().min(1, '请输入姓名').max(50, '姓名过长'),
  customerPhone: z.string().regex(/^1\d{10}$/, '请输入正确的11位手机号'),
  region: z.string().optional(),
  detailAddress: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = publicBookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tenantCode, customerName, customerPhone, region, detailAddress } = result.data;

    // 1. 查找租户
    const tenant = await db.query.tenants.findFirst({
      where: and(
        eq(tenants.code, tenantCode),
        eq(tenants.status, 'active'),
        eq(tenants.isActive, true)
      ),
      columns: { id: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: '未找到该商家或商家未激活' },
        { status: 404 }
      );
    }

    // 2. 查找该租户下的一个有效用户，用于填充 createdBy (因为 schema 要求 notNull)
    const adminUser = await db.query.users.findFirst({
      where: eq(users.tenantId, tenant.id),
      columns: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ success: false, error: '商家账户异常' }, { status: 500 });
    }

    // 3. 构建地址信息
    const fullAddress = [region, detailAddress].filter(Boolean).join(' ');

    // 4. 创建线索
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const leadNo = `LD${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${suffix}`;

    await db.insert(leads).values({
      tenantId: tenant.id,
      leadNo: leadNo,
      customerName,
      customerPhone,
      address: fullAddress,
      status: 'PENDING_ASSIGNMENT', // 待分配
      intentionLevel: 'MEDIUM', // 默认中意向
      createdBy: adminUser.id,
      notes: '来自小程序首页公开预约表单的客户',
      sourceDetail: '小程序公开落地页',
    });

    return NextResponse.json({ success: true, message: '预约成功' });
  } catch (error) {
    logger.error('小程充公开预约失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
