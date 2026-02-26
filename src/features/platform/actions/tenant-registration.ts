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
import { AuditService } from '@/shared/services/audit-service';
import { checkRateLimit } from '@/shared/middleware/rate-limit';
import { headers } from 'next/headers';
import { notificationService } from '@/features/notifications/service';

// ============ 类型定义 ============

/**
 * 租户申请数据接口
 */
export interface TenantApplicationData {
  /** 企业全称：必须与营业执照保持一致 */
  companyName: string;
  /** 申请联系人姓名 */
  applicantName: string;
  /** 联系电话：将作为该租户 BOSS 账号的登录标识 */
  phone: string;
  /** 联系邮箱：用于接收系统审批状态通知 */
  email: string;
  /** 初始管理员密码：审批通过后用于登录系统 */
  password: string;
  /** 企业所属地区 (省份)：用于区域化数据管理 */
  region: string;
  /** 业务主营方向简介 (选填)：辅助平台管理员快速了解企业背景 */
  businessDescription?: string;
}

/**
 * 租户申请处理结果接口
 */
export interface TenantApplicationResult {
  /** 是否处理成功：仅表示提交申请是否持久化成功 */
  success: boolean;
  /** 新生成的租户 ID：持久化后生成的 UUID */
  tenantId?: string;
  /** 错误信息：提交失败时的友好错误提示 */
  error?: string;
}

// ============ 验证 Schema ============

/**
 * 租户入驻申请表单校验模式
 * 
 * 校验规则：
 * - 企业名称：2-100字符
 * - 联系人：2-100字符
 * - 手机号：严格中国大陆手机号正则
 * - 密码：至少8位，且必须包含字母和数字
 */
const tenantApplicationSchema = z.object({
  companyName: z.string().min(2, '企业名称至少2个字符').max(100, '企业名称最多100个字符'),
  applicantName: z.string().min(2, '联系人姓名至少2个字符').max(100, '联系人姓名最多100个字符'),
  phone: z.string().regex(/^\d{8,11}$/, '请输入有效的手机号'),
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
 * 提交租户入驻申请 (核心流程)
 *
 * 业务流程：
 * 1. 【校验】执行 Zod 全量表单合法性校验。
 * 2. 【防爬/限流】检查该手机号在 24 小时内的提交次数（最多 3 次），缓解垃圾申请风险。
 * 3. 【唯一性】检查手机号和邮箱是否在全系统中已被占用。
 * 4. 【标识】使用 nanoid 生成 8 位大写的唯一租户代码 (Tenant Code)。
 * 5. 【持久化】在数据库事务中创建租户记录（状态：pending_approval）及对应的 BOSS 管理员账号（状态：未激活）。
 * 6. 【通知】异步向所有平台管理员发送入驻申请邮件，内含快速审批链接。
 * 
 * @param {TenantApplicationData} data - 入驻申请表单数据
 * @returns {Promise<TenantApplicationResult>} 处理结果
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

    // 2. 分布式防刷限流 (L5 增强)：基于 IP 的强拦截
    try {
      const headersList = await headers();
      const clientIP = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const rateLimitResult = await checkRateLimit(clientIP, 'registration');

      if (!rateLimitResult.allowed) {
        logger.warn('租户注册被限流拦截 (IP)', { ip: clientIP, remaining: rateLimitResult.remaining });
        return {
          success: false,
          error: '操作过于频繁，请稍后再试',
        };
      }
    } catch (error) {
      // 限流服务异常，走降级逻辑，记录日志并放行
      logger.error('限流检查服务异常 (降级处理)', { error });
    }

    // 3 & 4. 注册频率限制 & 手机邮箱唯一性检查 (DB 级限流)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentApplications, existingUser] = await Promise.all([
      db.query.tenants.findMany({
        where: and(
          eq(tenants.applicantPhone, data.phone),
          gte(tenants.createdAt, oneDayAgo),
        ),
        columns: { id: true },
      }),
      db.query.users.findFirst({
        where: or(eq(users.phone, data.phone), eq(users.email, data.email)),
      })
    ]);

    if (recentApplications.length >= 3) {
      return { success: false, error: '提交过于频繁，请24小时后再试' };
    }

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

    // 审计：记录新租户申请入驻
    try {
      await AuditService.log(db, {
        tableName: 'tenants',
        recordId: result.id,
        action: 'TENANT_APPLICATION_SUBMITTED',
        userId: 'system', // 此时用户尚未激活
        tenantId: result.id,
        details: {
          companyName: data.companyName,
          applicantName: data.applicantName,
          phone: data.phone,
          region: data.region,
          method: 'self_registration'
        }
      });
    } catch (auditErr) {
      logger.error('记录租户注册审计日志失败:', auditErr);
    }

    logger.info('新租户入驻申请提交成功', {
      tenantId: result.id,
      companyName: data.companyName
    });

    // 5. 异步发送管理员通知（邮件 + 站内通知，增加简单重试机制以提高可靠性）
    (async () => {
      const MAX_RETRIES = 3;
      let attempt = 0;

      while (attempt < MAX_RETRIES) {
        try {
          // 查询所有超级管理员（含 id、email、name，用于站内通知和邮件）
          const admins = await db.query.users.findMany({
            where: eq(users.isPlatformAdmin, true),
            columns: { id: true, email: true, name: true, tenantId: true },
          });

          if (admins.length === 0) break;

          // ── 5a. 发送邮件通知 ──
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

          // ── 5b. 发送站内通知（IN_APP）给每位平台管理员 ──
          // 平台管理员不属于任何租户，使用其自身 id 作为 tenantId 的占位（通知系统要求必填）
          // 注意：此处使用 Promise.allSettled 确保单条失败不影响其他管理员
          const notificationResults = await Promise.allSettled(
            admins.map((admin) =>
              notificationService.send({
                // 平台管理员记录的 tenantId 可能为 null，使用 admin.id 作为兜底
                tenantId: admin.tenantId ?? admin.id,
                userId: admin.id,
                type: 'SYSTEM',
                title: `新的企业入驻申请：${data.companyName}`,
                content: `联系人：${data.applicantName}，联系电话：${data.phone}，请前往审批页面处理`,
                link: '/admin/tenants',
              })
            )
          );

          // 记录站内通知的发送结果
          notificationResults.forEach((res, idx) => {
            if (res.status === 'rejected') {
              logger.error(`向管理员 ${admins[idx]?.id} 发送站内通知失败:`, res.reason);
            }
          });

          break; // 邮件和通知均已发送，退出循环
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
