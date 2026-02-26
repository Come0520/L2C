// @ts-nocheck
'use server';

import { db } from '@/shared/api/db';
import { verificationCodes, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '@/shared/lib/email';
import { hash } from 'bcryptjs';
import { logger } from '@/shared/lib/logger';
import { z } from 'zod';
import { ActionState as ActionResponse } from '@/shared/lib/server-action';

// Validation schemas
export const requestResetSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, '重置链接无效，缺失令牌'),
  newPassword: z.string().min(8, '密码长度不能少于 8 位'),
});

/**
 * 发起密码重置请求：生成 token 并发送邮件
 *
 * @param data 包含邮箱的请求数据
 * @returns 统一 ActionResponse 格式
 */
export async function requestPasswordReset(
  data: z.infer<typeof requestResetSchema>
): Promise<ActionResponse<null>> {
  try {
    const parsed = requestResetSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || '验证失败' },
      };
    }

    const { email } = parsed.data;

    // 查找用户
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    // 为防范邮箱枚举攻击，如果用户不存在或未激活，也返回成功响应
    if (!user || !user.isActive || !user.email) {
      logger.info(
        `[Auth:ResetPassword] Password reset requested for non-existent or inactive email: ${email}`
      );
      return { success: true, data: null }; // 模仿成功，但不发邮件
    }

    // 生成 token 并设置过期时间 (15分钟)
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 将 token 保存到 verification_codes 表
    await db.insert(verificationCodes).values({
      userId: user.id,
      email: user.email,
      code: Math.floor(100000 + Math.random() * 900000).toString(), // 仍然生成个验证码，虽然对于重置链接主要用 token
      token: token,
      type: 'PASSWORD_RESET',
      expiresAt,
    });

    // 发送重置邮件
    // 构造重置链接 (假设通过 NEXTAUTH_URL 环境变量或者默认本地端口)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailSent = await sendEmail({
      to: user.email,
      subject: 'L2C 系统密码重置',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>密码重置请求</h2>
          <p>您好，${user.name || '用户'}，</p>
          <p>我们收到了您重置密码的请求。如果您没有发起此请求，请忽略此邮件。</p>
          <p>请点击以下链接重置您的密码（链接将在15分钟后失效）：</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">重置密码</a>
          </div>
          <p>如果按钮无法点击，请复制以下链接到浏览器进行访问：</p>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #6b7280; font-size: 12px; text-align: center;">此邮件由 L2C 系统自动发送，请勿回复。</p>
        </div>
      `,
    });

    if (!emailSent) {
      logger.error(`[Auth:ResetPassword] Failed to send reset email to ${email}`);
      return {
        success: false,
        error: { code: 'EMAIL_SEND_FAILED', message: '重置邮件发送失败，请联系管理员或稍后重试' },
      };
    }

    logger.info(`[Auth:ResetPassword] Check password reset email sent to ${email}`);
    return { success: true, data: null };
  } catch (error) {
    logger.error('[Auth:ResetPassword] Exception in requestPasswordReset:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '请求过程中发生内部错误' },
    };
  }
}

/**
 * 执行密码重置：校验 token 并更新密码
 *
 * @param data 包含 token 和新密码的数据
 * @returns 统一 ActionResponse 格式
 */
export async function resetPassword(
  data: z.infer<typeof resetPasswordSchema>
): Promise<ActionResponse<null>> {
  try {
    const parsed = resetPasswordSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || '验证失败' },
      };
    }

    const { token, newPassword } = parsed.data;

    // 查找有效 token (未过期且未被使用)
    const activeCode = await db.query.verificationCodes.findFirst({
      where: and(
        eq(verificationCodes.token, token),
        eq(verificationCodes.type, 'PASSWORD_RESET'),
        eq(verificationCodes.used, false)
      ),
    });

    if (!activeCode) {
      return {
        success: false,
        error: { code: 'INVALID_TOKEN', message: '重置链接无效或已使用' },
      };
    }

    // 检查是否过期
    if (new Date() > activeCode.expiresAt) {
      return {
        success: false,
        error: { code: 'EXPIRED_TOKEN', message: '重置链接已过期，请重新发起请求' },
      };
    }

    // 生成新密码的哈希值
    const passwordHash = await hash(newPassword, 12);

    // 更新用户密码 和 token 状态 (Transaction 通常更好，但这里可以用连续的 await 或者简单的 batch)
    await db.transaction(async (tx) => {
      // 1. 更新密码
      await tx.update(users).set({ passwordHash }).where(eq(users.id, activeCode.userId));

      // 2. 将 token 标记为已使用
      await tx
        .update(verificationCodes)
        .set({ used: true })
        .where(eq(verificationCodes.id, activeCode.id));
    });

    logger.info(`[Auth:ResetPassword] Password successfully reset for user ${activeCode.userId}`);
    return { success: true, data: null };
  } catch (error) {
    logger.error('[Auth:ResetPassword] Exception in resetPassword:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '密码重置过程中发生内部错误' },
    };
  }
}
