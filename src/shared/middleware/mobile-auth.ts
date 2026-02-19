/**
 * 移动端认证中间件
 * 
 * 功能：
 * 1. 验证 JWT Token
 * 2. 解析用户信息和角色
 * 3. 按角色过滤 API 访问权限
 */

import { NextRequest } from 'next/server';
import { verifyToken, MobileRole } from '@/shared/lib/jwt';
import { apiUnauthorized, apiForbidden } from '@/shared/lib/api-response';

// ============================================================
// 类型定义
// ============================================================

/**
 * 移动端用户会话信息
 */
export interface MobileSession {
    userId: string;
    tenantId: string;
    phone: string;
    role: MobileRole;
    name?: string;
    traceId: string; // 请求追踪 ID
    userAgent?: string;
    ipAddress?: string;
}

/**
 * 认证结果
 */
export type AuthResult =
    | { success: true; session: MobileSession }
    | { success: false; response: ReturnType<typeof apiUnauthorized> };

// ============================================================
// 认证函数
// ============================================================

/**
 * 从请求头中验证 JWT 并返回用户会话
 * 
 * @param request - Next.js 请求对象
 * @returns 认证结果
 */
export async function authenticateMobile(request: NextRequest): Promise<AuthResult> {
    const authHeader = request.headers.get('Authorization');
    // 获取或生成 Trace ID
    const traceId = request.headers.get('x-trace-id') || crypto.randomUUID();

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            success: false,
            response: apiUnauthorized('缺少认证信息'),
        };
    }

    const token = authHeader.substring(7);

    try {
        const payload = await verifyToken(token);

        if (!payload) {
            return {
                success: false,
                response: apiUnauthorized('Token 无效或已过期'),
            };
        }

        // 安全修复：确实从 Payload 中提取角色，增强权限控制
        // 如果旧 Token 没有 role 字段（迁移期间），需要处理
        if (!payload.role) {
            return {
                success: false,
                response: apiUnauthorized('Token 缺少权限信息，请重新登录'),
            };
        }

        const userAgent = request.headers.get('user-agent') || undefined;
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

        // 从 payload 中提取用户信息
        const session: MobileSession = {
            userId: payload.userId,
            tenantId: payload.tenantId,
            phone: payload.phone,
            role: payload.role,
            name: undefined,
            traceId,
            userAgent,
            ipAddress,
        };

        return { success: true, session };
    } catch (error) {
        console.error('Mobile auth error:', error);
        return {
            success: false,
            response: apiUnauthorized('Token 验证失败'),
        };
    }
}

// ============================================================
// 权限检查
// ============================================================

/**
 * 检查用户是否具有指定角色
 * 
 * @param session - 用户会话
 * @param allowedRoles - 允许的角色列表
 * @returns 权限检查结果
 */
export function checkMobileRole(
    session: MobileSession,
    allowedRoles: MobileRole[]
): { allowed: true } | { allowed: false; response: ReturnType<typeof apiForbidden> } {
    if (!allowedRoles.includes(session.role)) {
        return {
            allowed: false,
            response: apiForbidden(`该功能仅限 ${allowedRoles.join('/')} 角色使用`),
        };
    }
    return { allowed: true };
}

/**
 * 工人端专用权限检查
 */
export function requireWorker(session: MobileSession) {
    return checkMobileRole(session, ['WORKER']);
}

/**
 * 销售端专用权限检查
 */
export function requireSales(session: MobileSession) {
    return checkMobileRole(session, ['SALES']);
}

/**
 * 老板端专用权限检查
 */
export function requireBoss(session: MobileSession) {
    return checkMobileRole(session, ['BOSS']);
}

/**
 * 采购端专用权限检查
 */
export function requirePurchaser(session: MobileSession) {
    return checkMobileRole(session, ['PURCHASER']);
}

/**
 * 客户端专用权限检查
 */
export function requireCustomer(session: MobileSession) {
    return checkMobileRole(session, ['CUSTOMER']);
}

/**
 * 内部员工权限检查（工人/销售/老板/采购）
 */
export function requireInternal(session: MobileSession) {
    return checkMobileRole(session, ['WORKER', 'SALES', 'BOSS', 'PURCHASER']);
}
