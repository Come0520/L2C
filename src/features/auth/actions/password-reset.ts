'use server';

import { db } from '@/shared/api/db';
import { users, verificationCodes } from '@/shared/api/schema';
import { eq, and, gt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { hash } from 'bcryptjs';
import { sendEmail } from '@/shared/lib/email';
import {
  requestResetSchema,
  resetPasswordSchema
} from '../schemas/password-reset-schema';
import { logger } from '@/shared/lib/logger';
import { AuthAuditService } from '../services/auth-audit';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';


/**
 * ============================================================================
 * L2C Auth Module: Password Reset Server Actions
 * ============================================================================
 * 本文件涵盖了从发起到执行“忘记密码”重置流程的所有后端服务端核心逻辑。
 */

/**
 * 密码重置业务领域内常量配置：Token 过期安全时效 (毫秒)
 * 
 * @description
 * - 默认设定为 24 小时 (24 * 60 * 60 * 1000)。
 * - 超过此时长的令牌将被认定为作废，需重新发起重置申请，避免令牌被长时间截留盗用。
 *
 * @constant {number}
 */
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * 密码重置业务领域内常量配置：Bcrypt 密码哈希盐值迭代轮数 (Salt Rounds)
 * 
 * @description
 * - 采用 10 轮迭代。
 * - 此数值是安全性和计算性能之间的一个标准折点。每增加 1 轮，耗时会指数级增长。
 *
 * @constant {number}
 */
const BCRYPT_ROUNDS = 10;

/**
 * UUID v4 Token 生成器辅助封装 (仅示范 JSDoc)
 *
 * @description 封装第三方生成库，保证所有的鉴权 Token 采用同一标准化策略生成。
 *
 * @returns {string} 符合 RFC4122 标准的 36 位伪随机字符序列
 */
const generateSecureToken = (): string => uuidv4();

/**
 * Token 过期时间推算辅助工具
 *
 * @description 结合当前基准时钟和配置的时效，给出 Date 对象，存入数据库比对。
 *
 * @returns {Date} 计算出的具体过期截止日历时间
 */
const calculateExpiryDate = (): Date => new Date(Date.now() + TOKEN_EXPIRY_MS);

/**
 * 邮件投递模块封装调用
 *
 * @description 负责将带有 Token 的可拼接访问链接投递至目标邮箱。
 *
 * @param {string} email - 用户找回密码时接收函件的挂号邮箱
 * @param {string} resetLink - 拼凑完毕的验证长链接，可一键跳转重置页
 */
const dispatchResetEmail = async (email: string, resetLink: string) => {
  await sendEmail({
    to: email,
    subject: '密码重置请求 - L2C系统',
    text: `请点击以下链接重置您的密码（24小时内有效）：\n${resetLink}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>密码重置请求</h2>
        <p>您请求了重置 L2C 系统登录密码。</p>
        <p>请点击下方链接进行重置，该链接将在24小时后失效：</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">重置密码</a>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">如果这不是您本人的操作，请忽略此邮件。</p>
      </div>
    `
  });
};

/**
 * 请求发起密码重置流程 (Server Action)
 * 
 * @description
 * 接收用户提交的找回密码申请号（邮箱地址）。
 * 
 * 核心安全机制：
 * - 防范邮箱遍历攻击 (Email Enumeration Prevention): 
 *   即使用户不存在于系统中，接口也总是返回一致的成功提示，
 *   使恶意攻击者无法通过接口响应字典判断该邮箱是否曾注册。
 * 
 * 核心流程追踪：
 * 1. 检验邮箱。
 * 2. 入库寻找关联 User。
 * 3. 产生高随机性并有时效性的 Token。
 * 4. 落地 Token 插入到 verification_codes 凭证表中。
 * 5. 调用 SMTP 邮件组件将找回门票送出。
 * 
 * @param {z.infer<typeof requestResetSchema>} params - 包含 target 邮箱的请求包
 * @param {Object} context - Server action 的附随环境隔离舱（无 session 也可唤起）
 * 
 * @returns {Promise<ActionResponse<void>>} 固定形态的虚拟成功体，掩人耳目，实际可能发了也可能没发邮件。
 * 
 * @security 此接口面向未登录的游客池开放，因此无需 session。
 */
export const requestPasswordReset = async (rawData: z.infer<typeof requestResetSchema>) => {
  const parsed = requestResetSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: '输入验证失败' };
  }
  const params = parsed.data;
  const { email } = params;

  try {
    /** 
     * 查询匹配用户的存在性
     * @description 若系统中没此人，由于隐私枚举策略也不能抛出明显的业务异常。
     */
    const [user] = await db
      .select({ id: users.id, tenantId: users.tenantId, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    /** 防范钓鱼/枚举攻击的隐形断点：若用户为假，直接假装全套流程已走完。 */
    if (!user) {
      logger.info('Password reset requested for non-existent email', {
        email: email.replace(/(.{2}).*(.{2}@)/, '$1***$2') // 脱敏
      });
      return { success: true };
    }

    /** 
     * Token 获取及过期倒计时演算
     */
    const token = generateSecureToken();
    const expiresAt = calculateExpiryDate();

    /**
     * 将找回记录及对应时效锚点插入 verification_codes 凭证区
     * 只有该重置门票正确方能唤起后续实质修改动作。
     */
    await db.insert(verificationCodes).values({
      userId: user.id,
      email: email,
      token: token,
      code: 'LINK_ONLY', // 作为必填字段的占位填充，邮件链接不需要显示键入短口令
      type: 'PASSWORD_RESET',
      expiresAt: expiresAt,
    });

    /** 日志审计：宣告门票已分发 (注意脱敏) */
    logger.info('Password reset token generated', {
      userId: user.id,
      tenantId: user.tenantId
    });

    /**
     * 拼接前后台解耦的系统完整落地 URL 链路
     * 需检测 NEXT_PUBLIC_APP_URL 注入
     */
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    /** 实质打出发信指令 */
    await dispatchResetEmail(email, resetLink);

    /** 结构化记录此事件留痕 */
    await AuthAuditService.logPasswordResetRequested(db, {
      userId: user.id,
      tenantId: user.tenantId,
      email: email
    });

    return { success: true };
  } catch (error) {
    /** 
     * 只将实质报错反馈入日志收集端点（防止由于连接等原因失败未被察觉）
     */
    logger.error('Failed to process password reset request', { error, email: email.replace(/(.{2}).*(.{2}@)/, '$1***$2') });
    return { success: false, error: '处理请求时发生错误，请稍后重试' };
  }
};

/**
 * 校验门票有效性的中立函数模块
 *
 * @description 一方面查验是否存在该 token 归属的验证码行，另一方面强校验时间标尺且未被消耗。
 * 
 * @param {string} token - 邮戳带来的门票随机串
 * 
 * @returns {Promise<{ user: any, vcId: string } | null>} 返回携带对应合法用户的映射及凭证ID，或 null
 */
const validateResetTokenIntactness = async (token: string) => {
  const vc = await db.query.verificationCodes.findFirst({
    where: (vc, { eq, and, gt }) => and(
      eq(vc.token, token),
      eq(vc.type, 'PASSWORD_RESET'),
      eq(vc.used, false),
      gt(vc.expiresAt, new Date())
    )
  });

  if (!vc) return null;

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, vc.userId)
  });

  return user ? { user, vcId: vc.id } : null;
};

/**
 * 加密运算封装件
 *
 * @description 转包裹 bcrypt 的散列摘要方法。
 * 
 * @param {string} password - 需要隐藏混码的原生密码明文。
 * 
 * @returns {Promise<string>} 被混淆了盐值的密文长串。
 */
const applyPasswordHash = async (password: string): Promise<string> => {
  return await hash(password, BCRYPT_ROUNDS);
};

/**
 * 验证并执行新密码的录入 (Server Action)
 * 
 * @description
 * 依据合法的 Token 凭证修改用户的登录密码散列值。
 * 
 * 核心安全机制：
 * - 令牌强时效检验: 验证 Token 存在且并未过期 (大于当前时间)。
 * - 单次消耗机制: 验证过后，不仅要应用新密码，还要立即彻底作废（清空）本次消耗的 Token，避免同一 Token 重放。
 * - 多表联合事务 (Transaction): 采取强事务保证密码写入与 Token 清理同生共死。
 * 
 * @param {z.infer<typeof resetPasswordSchema>} params - 包含 token 及用户两遍确认的新密码。
 * @param {Object} context - 请求容器上下文。
 * 
 * @returns {Promise<ActionResponse<void>>} 修改后的闭环业务状态告知。
 * 
 * @security 此接口也是面向未登录访客（因为他忘了密码登不进），不需要提取鉴权 session。
 */
export const resetPassword = async (rawData: z.infer<typeof resetPasswordSchema>) => {
  const parsed = resetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: '输入验证失败' };
  }
  const params = parsed.data;
  const { token, newPassword } = params;

  try {
    /** 
     * 1. 使用分装的校验器核对。
     */
    const record = await validateResetTokenIntactness(token);

    if (!record || !record.user) {
      /** 非法或过期的 Token 返回特定的友好提示词给前台，使其导向重新索要链接。 */
      logger.warn('Attempted to reset password with invalid or expired token');
      return { success: false, error: '重置链接无效或已过期，请重新申请' };
    }

    const { user, vcId } = record;

    /**
     * 2. 加密转化。
     */
    const hashedPassword = await applyPasswordHash(newPassword);

    /**
     * 3. 发动底层数据事务处理。
     * @description db.transaction 开启底层一致性的多命令执行队列。
     */
    await db.transaction(async (tx) => {
      // 1. 设置用户新密码哈希
      await tx.update(users)
        .set({
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // 2. 将 verification_codes 的该次重置门票核销（作废）
      await tx.update(verificationCodes)
        .set({
          used: true
        })
        .where(eq(verificationCodes.id, vcId));

      await AuthAuditService.logPasswordResetCompleted(tx, {
        userId: user.id,
        tenantId: user.tenantId,
      });
    });

    /** 外围系统综合监视留下的标语 */
    logger.info('Password successfully reset', {
      userId: user.id,
      tenantId: user.tenantId
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to reset password', { error });
    return { success: false, error: '重置密码失败，请稍后重试' };
  }
};
