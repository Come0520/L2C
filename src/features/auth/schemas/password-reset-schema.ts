import { z } from 'zod';

/**
 * 密码重置功能的 Zod 校验 Schema 集合
 *
 * @description 独立于 Server Action 文件导出，
 * 因为 "use server" 文件只允许导出 async 函数，
 * 而 Schema 定义是同步的常量。
 *
 * @module password-reset-schema
 */

/**
 * 请求密码重置的校验 Schema
 *
 * @description 校验用户发起重置请求时提交的邮箱地址格式。
 * 仅包含 email 字段，使用 Zod 内置的 email 格式校验器。
 *
 * @property {string} email - 用户的注册邮箱地址，必须为有效的邮箱格式
 *
 * @example
 * ```ts
 * const result = requestResetSchema.safeParse({ email: 'user@example.com' });
 * if (result.success) {
 *   // 邮箱格式有效
 * }
 * ```
 */
export const requestResetSchema = z.object({
  /** 用户注册时使用的邮箱地址，必须为合法邮箱格式 */
  email: z.string().email('请输入有效的邮箱地址'),
});

/**
 * 请求密码重置的输入类型
 *
 * @description 由 requestResetSchema 推导的 TypeScript 类型定义
 */
type RequestResetInput = z.infer<typeof requestResetSchema>;

/**
 * 执行密码重置的校验 Schema
 *
 * @description 校验用户点击重置链接后提交的数据，包含：
 * - token: 从邮件链接中获取的一次性重置令牌
 * - newPassword: 用户设置的新密码（最少 8 位，增强安全性）
 *
 * @property {string} token - 重置令牌，由邮件链接 URL 参数传入，不可为空
 * @property {string} newPassword - 新密码，最少 8 位字符
 *
 * @example
 * ```ts
 * const result = resetPasswordSchema.safeParse({
 *   token: 'uuid-from-email',
 *   newPassword: 'newSecure123!'
 * });
 * ```
 */
export const resetPasswordSchema = z.object({
  /** 一次性密码重置令牌，从邮件中获取 */
  token: z.string().min(1, '重置链接无效，缺失令牌'),
  /** 用户设置的新密码，最少 8 位字符 */
  newPassword: z.string().min(8, '密码长度不能少于 8 位'),
});

/**
 * 执行密码重置的输入类型
 *
 * @description 由 resetPasswordSchema 推导的 TypeScript 类型定义
 */
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
