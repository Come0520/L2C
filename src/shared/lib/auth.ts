import NextAuth, { Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { unstable_cache } from 'next/cache';
import { db } from '@/shared/api/db';
import { users, roles } from '@/shared/api/schema';
import { auditLogs } from '@/shared/api/schema/audit';
import { eq, or, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { z } from 'zod';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                const schema = z.object({
                    username: z.string().min(1),
                    password: z.string().min(1),
                });

                const parsed = schema.safeParse(credentials);
                if (!parsed.success) {
                    return null;
                }
                const { username, password } = parsed.data;

                const user = await db.query.users.findFirst({
                    where: and(
                        or(
                            eq(users.email, username),
                            eq(users.phone, username)
                        ),
                        // 安全修复：检查用户是否已被禁用
                        eq(users.isActive, true)
                    ),
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const passwordsMatch = await compare(password, user.passwordHash);

                if (!passwordsMatch) {
                    return null;
                }

                // 处理多角色逻辑：优先使用 roles 数组，如果为空则兼容旧 role
                const roles = (user.roles as string[])?.length > 0
                    ? (user.roles as string[])
                    : [user.role || 'USER'];

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.avatarUrl,
                    role: user.role || 'USER', // Deprecated
                    roles: roles,
                    tenantId: user.tenantId,
                    isPlatformAdmin: user.isPlatformAdmin || false,
                };
            },
        }),
        {
            id: 'wechat',
            name: 'WeChat',
            type: 'oauth',
            clientId: process.env.WECHAT_CLIENT_ID,
            clientSecret: process.env.WECHAT_CLIENT_SECRET,
            authorization: 'https://open.weixin.qq.com/connect/qrconnect?appid=' + process.env.WECHAT_CLIENT_ID + '&redirect_uri=' + process.env.NEXTAUTH_URL + '/api/auth/callback/wechat&response_type=code&scope=snsapi_login#wechat_redirect',
            token: 'https://api.weixin.qq.com/sns/oauth2/access_token',
            userinfo: 'https://api.weixin.qq.com/sns/userinfo',
            profile(profile) {
                // 微信登录用户默认无租户归属，需通过邀请链接确定
                // 员工：管理员分享的员工邀请二维码
                // 客户：客户详情页的客户邀请链接
                return {
                    id: profile.openid,
                    name: profile.nickname,
                    email: null,
                    image: profile.headimgurl,
                    role: '__UNBOUND__',      // 待通过邀请链接确定
                    roles: ['__UNBOUND__'],
                    tenantId: '__UNBOUND__',  // 待通过邀请链接绑定
                    isPlatformAdmin: false,
                }
            },
        }
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.tenantId = token.tenantId;
                session.user.role = token.role;
                session.user.roles = token.roles || [token.role];
                session.user.isPlatformAdmin = token.isPlatformAdmin;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.tenantId = user.tenantId;
                token.role = user.role;
                token.roles = user.roles;
                token.isPlatformAdmin = user.isPlatformAdmin;
            }
            return token;
        }
    },
    // secret: process.env.AUTH_SECRET, // Usually auto-detected
});

/**
 * 权限检查函数 (RBAC via DB)
 * @param session - 会话对象
 * @param permissionName - 权限名称
 * @param options - 可选配置
 *   - audit: 是否记录审计日志
 *   - action: 审计日志中的操作描述
 *   - resourceType: 资源类型
 *   - resourceId: 资源 ID
 */


export interface CheckPermissionOptions {
    audit?: boolean;
    action?: string;
    resourceType?: string;
    resourceId?: string;
}

export const checkPermission = async (
    session: Session | null,
    permissionName: string,
    options?: CheckPermissionOptions
) => {
    if (!session?.user?.roles || session.user.roles.length === 0) {
        return false;
    }

    const hasPermission = session.user.roles.includes('ADMIN') || await checkRolePermission(session, permissionName);

    // 如果需要审计日志记录
    if (options?.audit && session.user.tenantId) {
        try {
            await db.insert(auditLogs).values({
                tenantId: session.user.tenantId,
                tableName: options.resourceType || 'PERMISSION_CHECK',
                recordId: options.resourceId || permissionName,
                action: options.action || 'ACCESS',
                userId: session.user.id,
                changedFields: {
                    permission: permissionName,
                    roles: session.user.roles,
                    granted: hasPermission,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (e) {
            console.error('Audit log for permission check failed:', e);
        }
    }

    return hasPermission;
};

/**
 * 内部权限检查（带缓存）
 */
const checkRolePermission = async (session: Session, permissionName: string): Promise<boolean> => {
    const getRolePermissions = unstable_cache(
        async (roleCode: string, tenantId: string) => {
            const role = await db.query.roles.findFirst({
                where: and(
                    eq(roles.code, roleCode),
                    eq(roles.tenantId, tenantId)
                ),
                columns: {
                    permissions: true,
                }
            });
            return role?.permissions || [];
        },
        ['role-permissions'],
        { revalidate: 300, tags: ['roles'] }
    );

    try {
        // 并行检查所有角色的权限
        const results = await Promise.all(
            (session.user.roles || []).map(role =>
                getRolePermissions(role, session.user.tenantId)
            )
        );

        // 合并所有角色的权限
        const allPermissions = new Set(results.flat());

        return allPermissions.has(permissionName) || allPermissions.has('*');
    } catch (e) {
        console.error('Permission check failed', e);
        return false;
    }
};
