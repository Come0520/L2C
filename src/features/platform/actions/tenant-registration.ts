'use server';

/**
 * 租户注册 Server Actions
 *
 * 提供租户自助注册申请功能
 */

import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq, or, and, gte } from 'drizzle-orm';
import { sendEmail } from '@/shared/lib/email';
import { formatDate } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/logger';

// ============ 类型定义 ============

export interface TenantApplicationData {
  companyName: string;
  applicantName: string;
  phone: string;
  email: string;
  password: string;
  region: string;
  businessDescription?: string;
}

export interface TenantApplicationResult {
  success: boolean;
  tenantId?: string;
  error?: string;
}

// ============ 验证 Schema ============

const tenantApplicationSchema = z.object({
  companyName: z.string().min(2, '企业名称至少2个字符').max(100, '企业名称最多100个字符'),
  applicantName: z.string().min(2, '联系人姓名至少2个字符').max(100, '联系人姓名最多100个字符'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少8位')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, '密码必须包含字母和数字'),
  region: z.string().min(1, '请选择地区'),
  businessDescription: z.string().max(500, '业务简介最多500个字符').optional(),
});

// ============ Server Actions ============

/**
 * 提交租户入驻申请
 *
 * 流程：
 * 1. 验证输入数据
 * 2. 检查手机号/邮箱是否已存在
 * 3. 创建待审批租户记录
 * 4. 创建待激活的 BOSS 用户
 */
export async function submitTenantApplication(
  data: TenantApplicationData
): Promise<TenantApplicationResult> {
  try {
    // 1. 验证输入
    const validated = tenantApplicationSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || '输入验证失败',
      };
    }

    // 2. 注册频率限制：同一手机号 24 小时内最多提交 3 次申请
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentApplications = await db.query.tenants.findMany({
      where: and(
        eq(tenants.applicantPhone, data.phone),
        gte(tenants.createdAt, oneDayAgo),
      ),
      columns: { id: true },
    });

    if (recentApplications.length >= 3) {
      return { success: false, error: '提交过于频繁，请24小时后再试' };
    }

    // 3. 检查手机号/邮箱是否已存在（已激活的用户）
    const existingUser = await db.query.users.findFirst({
      where: or(eq(users.phone, data.phone), eq(users.email, data.email)),
    });

    if (existingUser) {
      return { success: false, error: '该手机号或邮箱已被注册' };
    }

    // 3. 生成唯一租户代码
    const tenantCode = `T${nanoid(8).toUpperCase()}`;

    // 4. 在事务中创建租户和用户
    const result = await db.transaction(async (tx) => {
      // 创建待审批租户
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: data.companyName,
          code: tenantCode,
          status: 'pending_approval',
          applicantName: data.applicantName,
          applicantPhone: data.phone,
          applicantEmail: data.email,
          region: data.region,
          businessDescription: data.businessDescription || null,
          isActive: false, // 审批前不激活
        })
        .returning({ id: tenants.id });

      // 创建待激活的 BOSS 用户
      const passwordHash = await hash(data.password, 12);
      await tx.insert(users).values({
        tenantId: newTenant.id,
        name: data.applicantName,
        phone: data.phone,
        email: data.email,
        passwordHash,
        role: 'BOSS',
        isActive: false, // 审批通过后激活
        permissions: [], // 审批后分配默认权限
      });

      return newTenant;
    });

    // 5. 异步发送管理员通知 (增加简单重试机制以提高可靠性)
    (async () => {
      const MAX_RETRIES = 3;
      let attempt = 0;

      while (attempt < MAX_RETRIES) {
        try {
          // 查询所有超级管理员
          const admins = await db.query.users.findMany({
            where: eq(users.isPlatformAdmin, true),
            columns: { email: true, name: true },
          });

          if (admins.length === 0) break;

          const adminEmails = admins.map((a) => a.email).filter((e): e is string => Boolean(e));

          if (adminEmails.length > 0) {
            await sendEmail({
              to: adminEmails,
              subject: `[L2C] 新租户入驻申请: ${data.companyName}`,
              html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2>收到新的企业入驻申请</h2>
                                    <p><strong>企业名称：</strong>${data.companyName}</p>
                                    <p><strong>联系人：</strong>${data.applicantName}</p>
                                    <p><strong>联系电话：</strong>${data.phone}</p>
                                    <p><strong>邮箱：</strong>${data.email}</p>
                                    <p><strong>所属地区：</strong>${data.region}</p>
                                    <p><strong>申请时间：</strong>${formatDate(new Date())}</p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                                    <p>请登录管理后台进行审批：</p>
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/tenants" 
                                       style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                       前往审批
                                    </a>
                                </div>
                            `,
              text: `收到新的企业入驻申请：${data.companyName}，请登录后台审批。`,
            });
          }
          break; // 发送成功，退出循环
        } catch (err) {
          attempt++;
          logger.error(`发送管理员通知失败 (尝试 ${attempt}/${MAX_RETRIES}):`, err);
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒后重试
          }
        }
      }
    })();

    return { success: true, tenantId: result.id };
  } catch (error) {
    logger.error('租户申请失败:', error);
    return { success: false, error: '提交失败，请稍后重试' };
  }
}

/**
 * 查询租户申请状态
 *
 * @param phone - 申请人手机号
 * @returns 申请状态信息
 */
export async function getTenantApplicationStatus(phone: string): Promise<{
  found: boolean;
  status?: string;
  companyName?: string;
  rejectReason?: string;
}> {
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.applicantPhone, phone),
      columns: {
        name: true,
        status: true,
        rejectReason: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });

    if (!tenant) {
      return { found: false };
    }

    return {
      found: true,
      status: tenant.status,
      companyName: tenant.name,
      rejectReason: tenant.rejectReason || undefined,
    };
  } catch (error) {
    logger.error('查询申请状态失败:', error);
    return { found: false };
  }
}
