
import { db } from '@/shared/api/db';
import { verificationCodes } from '@/shared/api/schema/verification_codes';
import { eq, and, gt, desc } from 'drizzle-orm';
import { SmsService } from './sms.service';

export class VerificationCodeService {
    /**
     * 生成并在发送验证码
     * @param userId 用户ID
     * @param phone 手机号
     * @param type 验证码类型
     */
    static async generateAndSend(userId: string, phone: string, type: 'LOGIN_MFA' | 'PASSWORD_RESET' = 'LOGIN_MFA') {
        // 1. 生成6位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. 存入数据库 (有效期5分钟)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.insert(verificationCodes).values({
            userId,
            phone,
            code,
            type,
            expiresAt,
            used: false,
        });

        // 3. 发送短信
        const result = await SmsService.sendVerificationCode(phone, code);

        if (!result.success) {
            console.error(`Failed to send MFA code to ${phone}: ${result.message}`);
            // 依然返回生成的 Code (开发调试用) 或者 抛出错误?
            // 生产环境应该抛错。但为了稳健性，如果短信挂了，也许需要备用方案。
            // 这里我们抛错。
            throw new Error('短信发送失败，请稍后重试');
        }

        return code;
    }

    /**
     * 验证验证码
     * @param userId 用户ID
     * @param code 验证码
     * @param type 验证码类型
     */
    static async verify(userId: string, code: string, type: 'LOGIN_MFA' | 'PASSWORD_RESET' = 'LOGIN_MFA'): Promise<boolean> {
        // 查找最近一条未使用的、未过期的验证码
        const record = await db.query.verificationCodes.findFirst({
            where: and(
                eq(verificationCodes.userId, userId),
                eq(verificationCodes.code, code),
                eq(verificationCodes.type, type),
                eq(verificationCodes.used, false),
                gt(verificationCodes.expiresAt, new Date())
            ),
            orderBy: [desc(verificationCodes.createdAt)]
        });

        if (!record) {
            return false;
        }

        // 标记为已使用
        await db.update(verificationCodes)
            .set({ used: true })
            .where(eq(verificationCodes.id, record.id));

        return true;
    }
}
