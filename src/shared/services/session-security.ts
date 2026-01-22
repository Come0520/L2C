'use server';

import { db } from '@/shared/api/db';
import { auditLogs } from '@/shared/api/schema/audit';
import { auth } from '@/shared/lib/auth';
import { compare } from 'bcryptjs';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

/**
 * 会话安全服务
 * 
 * 功能：
 * - 敏感操作二次验证
 * - 会话活动记录
 * - 登录安全检查
 */

/**
 * 敏感操作类型
 */
export const SENSITIVE_ACTIONS = {
    DELETE_CUSTOMER: 'DELETE_CUSTOMER',
    APPROVE_LARGE_PAYMENT: 'APPROVE_LARGE_PAYMENT',
    CHANGE_USER_ROLE: 'CHANGE_USER_ROLE',
    DELETE_ORDER: 'DELETE_ORDER',
    VOID_INVOICE: 'VOID_INVOICE',
    EXPORT_DATA: 'EXPORT_DATA',
} as const;

export type SensitiveAction = typeof SENSITIVE_ACTIONS[keyof typeof SENSITIVE_ACTIONS];

/**
 * 需要二次验证的敏感操作列表
 */
const ACTIONS_REQUIRING_VERIFICATION: Set<SensitiveAction> = new Set([
    SENSITIVE_ACTIONS.DELETE_CUSTOMER,
    SENSITIVE_ACTIONS.APPROVE_LARGE_PAYMENT,
    SENSITIVE_ACTIONS.CHANGE_USER_ROLE,
    SENSITIVE_ACTIONS.DELETE_ORDER,
    SENSITIVE_ACTIONS.VOID_INVOICE,
]);

/**
 * 验证敏感操作 - 需要用户输入密码确认
 * 
 * @param password - 用户当前密码
 * @param action - 敏感操作类型
 * @param resourceId - 操作的资源 ID（可选）
 * @returns 验证结果
 */
export async function verifySensitiveAction(
    password: string,
    action: SensitiveAction,
    resourceId?: string
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id || !session.user.tenantId) {
        return { success: false, error: '未登录' };
    }

    // 检查是否需要验证
    if (!ACTIONS_REQUIRING_VERIFICATION.has(action)) {
        return { success: true };
    }

    // 获取用户密码哈希
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { passwordHash: true },
    });

    if (!user?.passwordHash) {
        return { success: false, error: '用户数据异常' };
    }

    // 验证密码
    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
        // 记录失败的验证尝试
        await logSecurityEvent(session.user.tenantId, session.user.id, {
            event: 'SENSITIVE_ACTION_VERIFY_FAILED',
            action,
            resourceId,
        });
        return { success: false, error: '密码错误' };
    }

    // 记录成功的验证
    await logSecurityEvent(session.user.tenantId, session.user.id, {
        event: 'SENSITIVE_ACTION_VERIFIED',
        action,
        resourceId,
    });

    return { success: true };
}

/**
 * 检查操作是否需要二次验证
 */
export function requiresVerification(action: SensitiveAction): boolean {
    return ACTIONS_REQUIRING_VERIFICATION.has(action);
}

/**
 * 记录安全事件
 */
async function logSecurityEvent(
    tenantId: string,
    userId: string,
    data: {
        event: string;
        action?: string;
        resourceId?: string;
        metadata?: Record<string, unknown>;
    }
) {
    try {
        await db.insert(auditLogs).values({
            tenantId,
            tableName: 'SECURITY_EVENT',
            recordId: data.event,
            action: data.action || data.event,
            userId,
            changedFields: {
                event: data.event,
                action: data.action,
                resourceId: data.resourceId,
                timestamp: new Date().toISOString(),
                ...data.metadata,
            },
        });
    } catch (e) {
        console.error('Failed to log security event:', e);
    }
}

/**
 * 检查会话是否过期（用于前端轮询）
 * 
 * @param lastActivityTime - 上次活动时间戳
 * @param timeoutMinutes - 超时分钟数（默认30分钟）
 */
export function isSessionExpired(
    lastActivityTime: number,
    timeoutMinutes: number = 30
): boolean {
    const now = Date.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    return (now - lastActivityTime) > timeoutMs;
}

/**
 * 会话配置
 */
export const SESSION_CONFIG = {
    // 会话超时（分钟）
    TIMEOUT_MINUTES: 30,
    // 敏感操作验证有效期（分钟）
    VERIFICATION_VALID_MINUTES: 5,
    // 最大登录失败次数
    MAX_LOGIN_ATTEMPTS: 5,
    // 锁定时间（分钟）
    LOCKOUT_MINUTES: 15,
} as const;
