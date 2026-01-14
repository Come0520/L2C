import NextAuth, { Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/shared/api/db';
import { users, roles } from '@/shared/api/schema';
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
                    where: or(
                        eq(users.email, username),
                        eq(users.phone, username)
                    ),
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const passwordsMatch = await compare(password, user.passwordHash);

                if (!passwordsMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.avatarUrl,
                    role: user.role || 'USER', // Default role
                    tenantId: user.tenantId,
                };
            },
        }),
        {
            id: 'wechat',
            name: 'WeChat',
            type: 'oauth',
            clientId: process.env.WECHAT_CLIENT_ID,
            clientSecret: process.env.WECHAT_CLIENT_SECRET,
            authorization: 'https://open.weixin.qq.com/connect/qrconnect?appid=' + process.env.WECHAT_CLIENT_ID + '&redirect_uri=' + process.env.NEXTAUTH_URL + '/api/auth/callback/wechat&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect',
            token: 'https://api.weixin.qq.com/sns/oauth2/access_token',
            userinfo: 'https://api.weixin.qq.com/sns/userinfo',
            profile(profile) {
                return {
                    id: profile.openid,
                    name: profile.nickname,
                    email: null,
                    image: profile.headimgurl,
                    role: 'GUEST', // Wechat login default role until bound
                    tenantId: 'DEFAULT', // Needs logic to bind tenant
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
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.tenantId = user.tenantId;
                token.role = user.role;
            }
            return token;
        }
    },
    // secret: process.env.AUTH_SECRET, // Usually auto-detected
});

/**
 * 权限检查函数 (RBAC via DB)
 */
import { unstable_cache } from 'next/cache';

export const checkPermission = async (session: Session | null, permissionName: string) => {
    if (!session?.user?.role) {
        return false;
    }

    if (session.user.role === 'ADMIN') {
        return true;
    }

    // Cache permission lookup
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
        const permissions = await getRolePermissions(session.user.role, session.user.tenantId);
        return permissions.includes(permissionName) || permissions.includes('*');
    } catch (e) {
        console.error('Permission check failed', e);
        return false;
    }
};


