import { z } from 'zod';

/**
 * 密码重置相关的 Zod 校验 Schema
 *
 * 独立于 server action 文件导出，因为 "use server" 文件只允许导出 async 函数。
 */

/** 请求重置密码的校验 schema */
export const requestResetSchema = z.object({
    email: z.string().email('请输入有效的邮箱地址'),
});

/** 执行密码重置的校验 schema */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, '重置链接无效，缺失令牌'),
    newPassword: z.string().min(8, '密码长度不能少于 8 位'),
});
