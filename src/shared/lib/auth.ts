import NextAuth, { Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { unstable_cache } from 'next/cache';
import { db } from '@/shared/api/db';
import { users, roles, tenantMembers } from '@/shared/api/schema';
import { eq, or, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { logger } from './logger';
import { checkLoginRateLimit, resetLoginRateLimit } from './auth-rate-limit';
import { AuditService } from '@/shared/services/audit-service';

/**
 * NextAuth 核心配置与导出
 *
 * 包含：
 * - handlers: 认证路由处理器
 * - auth: 用于获取服务端会话的函数 (await auth())
 * - signIn: 服务端/客户端登录函数
 * - signOut: 服务端/客户端注销函数
 */
/**
 * 根据 AUTH_URL 协议自动判断是否启用 secure cookie
 * 在 production + HTTP（如 E2E 测试 localhost）下必须禁用，否则浏览器拒绝存储 __Secure- 前缀的 cookie
 */
const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || '';
const useSecureCookies = authUrl.startsWith('https://');

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  useSecureCookies,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * 自定义身份验证逻辑
       * @param credentials - 登录凭证 (用户名/手机号/邮箱 + 密码)
       * @returns 验证成功返回用户信息，失败返回 null
       */
      authorize: async (credentials) => {
        try {
          const schema = z.object({
            username: z.string().min(1),
            password: z.string().min(1),
          });

          const parsed = schema.safeParse(credentials);
          if (!parsed.success) {
            return null;
          }
          const { username, password } = parsed.data;

          // PC端登录速率限制
          const rateCheck = checkLoginRateLimit(username);
          if (!rateCheck.allowed) {
            return null;
          }

          /**
           * DB query with isolated try-catch
           * If DB query fails, throw SYSTEM_ERROR instead of returning null
           */
          let candidates;
          try {
            candidates = await db.query.users.findMany({
              where: and(
                or(eq(users.email, username), eq(users.phone, username)),
                eq(users.isActive, true)
              ),
            });
          } catch (dbError) {
            logger.error('[Auth] DB query failed (system error, not password error)', {
              error: dbError instanceof Error ? dbError.message : String(dbError),
            });
            throw new Error('SYSTEM_ERROR: DB unavailable');
          }

          if (candidates.length === 0) {
            return null;
          }

          // 遍历 candidates 匹配密码（支持同邮箱/手机号多用户场景）
          let user: (typeof candidates)[0] | null = null;
          for (const candidate of candidates) {
            const isMatch = await compare(password, candidate.passwordHash || '');
            if (isMatch) {
              user = candidate;
              break;
            }
          }

          if (!user) {
            return null;
          }

          // 超管直接进入平台管理上下文，不参与任何租户业务
          if (user.isPlatformAdmin) {
            return {
              id: user.id,
              name: user.name ?? '',
              email: user.email ?? '',
              image: user.avatarUrl ?? '',
              tenantId: '__PLATFORM__',
              role: 'PLATFORM_ADMIN',
              roles: ['PLATFORM_ADMIN'],
              isPlatformAdmin: true,
            };
          }

          const memberships = await db.query.tenantMembers.findMany({
            where: and(eq(tenantMembers.userId, user.id), eq(tenantMembers.isActive, true)),
            with: {
              tenant: true,
            },
          });

          if (!memberships || memberships.length === 0) {
            if (user.tenantId) {
              const userRoles =
                (user.roles as string[])?.length > 0
                  ? (user.roles as string[])
                  : [user.role || 'USER'];
              resetLoginRateLimit(username);
              await AuditService.log(db, {
                tableName: 'auth_login',
                recordId: user.id,
                action: 'LOGIN_SUCCESS',
                userId: user.id,
                tenantId: user.tenantId,
                details: { method: 'credentials', platform: 'pc', fallback: 'legacy_tenantId' },
              });
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.avatarUrl,
                role: user.role || 'USER',
                roles: userRoles,
                tenantId: user.tenantId,
                isPlatformAdmin: false,
              };
            }

            logger.warn('[Auth] 用户无任何租户成员资格', { userId: user.id });
            return null;
          }

          // 确定要进入的租户：优先使用上次活跃的租户
          let activeMembership = memberships[0];
          if (user.lastActiveTenantId) {
            const lastActive = memberships.find((m) => m.tenantId === user.lastActiveTenantId);
            if (lastActive) {
              activeMembership = lastActive;
            }
          }

          const memberRoles =
            (activeMembership.roles as string[])?.length > 0
              ? (activeMembership.roles as string[])
              : [activeMembership.role || 'USER'];

          logger.info('[Auth] PC 端登录成功', {
            userId: user.id,
            tenantId: activeMembership.tenantId,
            membershipCount: memberships.length,
          });

          await AuditService.log(db, {
            tableName: 'auth_login',
            recordId: user.id,
            action: 'LOGIN_SUCCESS',
            userId: user.id,
            tenantId: activeMembership.tenantId,
            details: { method: 'credentials', platform: 'pc' },
          });

          // 登录成功重置速率限制
          resetLoginRateLimit(username);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
            role: activeMembership.role || 'USER',
            roles: memberRoles,
            tenantId: activeMembership.tenantId,
            isPlatformAdmin: false,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('[Auth:Debug] Exception in authorize:', error);

          // SYSTEM_ERROR: re-throw to let NextAuth pass real error type to frontend
          if (errorMsg.startsWith('SYSTEM_ERROR')) {
            logger.error('[Auth] System-level exception, aborting auth', { error: errorMsg });
            throw error;
          }

          logger.error('[Auth] Unexpected exception in authorize', { error: errorMsg });
          return null;
        }
      },
    }),
    {
      id: 'wechat',
      name: 'WeChat',
      type: 'oauth',
      clientId: process.env.WX_APPID,
      clientSecret: process.env.WX_APPSECRET,
      authorization:
        'https://open.weixin.qq.com/connect/qrconnect?appid=' +
        process.env.WX_APPID +
        '&redirect_uri=' +
        process.env.NEXTAUTH_URL +
        '/api/auth/callback/wechat&response_type=code&scope=snsapi_login#wechat_redirect',
      token: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      userinfo: 'https://api.weixin.qq.com/sns/userinfo',
      /**
       * 微信用户信息映射
       * @param profile - 微信原始用户信息
       * @returns 映射后的用户对象
       */
      /**
       * 微信用户信息映射
       *
       * @description 将微信服务器返回的原始 profile 数据（如 openid, nickname）映射到系统内部用户模型。
       *
       * @param profile - 微信原始用户信息
       * @returns 映射后的用户对象，包含 id, name, email, image 等字段
       */
      profile(profile) {
        // 微信登录用户默认无租户归属，需通过邀请链接确定
        // 员工：管理员分享的员工邀请二维码
        // 客户：客户详情页的客户邀请链接
        return {
          id: profile.openid,
          name: profile.nickname,
          email: null,
          image: profile.headimgurl,
          role: '__UNBOUND__', // 待通过邀请链接确定
          roles: ['__UNBOUND__'],
          tenantId: '__UNBOUND__', // 待通过邀请链接绑定
          isPlatformAdmin: false,
        };
      },
    },
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    /**
     * 会话回调，用于将用户信息注入到客户端 Session 中
     */
    /**
     * 会话回调 (Session Callback)
     *
     * @description
     * 每当检测到会话被查询时调用。此回调负责将 JWT 中的自定义载荷（如 id, role, tenantId）
     *注入到客户端可见的 Session 对象中。
     */
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.tenantId = token.tenantId;
        session.user.role = token.role;
        session.user.roles = token.roles || [token.role];
        session.user.isPlatformAdmin = token.isPlatformAdmin;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.preferences = token.preferences as any;
      }
      return session;
    },
    /**
     * JWT 回调，用于处理令牌内容
     */
    /**
     * 令牌回调 (JWT Callback)
     *
     * @description
     * 每当创建或更新 JWT 时调用。用于将数据库中的持久化字段存入令牌，
     * 减少后续在服务端各模块中查询数据库的次数。
     */
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.roles = user.roles;
        token.isPlatformAdmin = user.isPlatformAdmin;

        // NextAuth User interface doesn't natively include preferences without extending AdapterUser,
        // but we pass it from DB in authorize. Use unknown casting to avoid any.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.preferences = (user as unknown as { preferences?: any }).preferences;
      }
      return token;
    },
  },
  // secret: process.env.AUTH_SECRET, // 通常由 AUTH_SECRET 环境变量自动检测
});

/**
 * 权限检查配置项
 */
export interface CheckPermissionOptions {
  /** 是否记录审计日志 */
  audit?: boolean;
  /** 审计日志中的操作描述 */
  action?: string;
  /** 资源类型 */
  resourceType?: string;
  /** 资源 ID */
  resourceId?: string;
}

/**
 * 核心权限检查函数 (RBAC via DB)
 *
 * 校验逻辑：
 * 1. 检查是否存在有效的会话和角色。
 * 2. 如果是超级管理员 (ADMIN 角色) 直接通过。
 * 3. 调用 checkRolePermission 进行细粒度的权限位校验。
 * 4. 如果启用了 audit，记录审计日志到数据库。
 *
 * @param session - 会话对象
 * @param permissionName - 权限名称 (如: 'order.own.edit')
 * @param options - 可选配置 (审计记录等)
 * @returns 是否拥有权限
 */
export const checkPermission = async (
  session: Session | null,
  permissionName: string,
  options?: CheckPermissionOptions
) => {
  if (!session?.user?.roles || session.user.roles.length === 0) {
    logger.warn('权限检查失败：未找到有效会话或用户角色', {
      userId: session?.user?.id,
      permission: permissionName,
    });
    return false;
  }

  const hasPermission =
    session.user.roles.includes('ADMIN') || (await checkRolePermission(session, permissionName));

  if (!hasPermission) {
    logger.warn('[Auth:Security] 权限检查未通过：用户尝试越权访问', {
      userId: session.user.id,
      userName: session.user.name,
      roles: session.user.roles,
      permission: permissionName,
      tenantId: session.user.tenantId,
      path: typeof window !== 'undefined' ? window.location.pathname : 'server-side',
    });
  } else {
    // 仅在调试或高安全场景下记录成功日志，避免日志爆炸
    // logger.debug('[Auth:Security] 权限检查通过', { userId: session.user.id, permission: permissionName });
  }

  // 如果需要审计日志记录
  if (options?.audit && session.user.tenantId) {
    await AuditService.log(db, {
      tenantId: session.user.tenantId,
      tableName: options.resourceType || 'PERMISSION_CHECK',
      recordId: options.resourceId || permissionName,
      action: options.action || 'ACCESS',
      userId: session.user.id,
      details: {
        permission: permissionName,
        roles: session.user.roles,
        granted: hasPermission,
      },
    });
  }

  return hasPermission;
};

/**
 * 强制权限检查函数 (抛出异常)
 *
 * 如果用户没有指定权限，则直接抛出 Error('无权限')。
 * 用于 Server Actions 顶部拦截非法请求，确保授权失败时中断执行。
 *
 * @param session - 会话对象
 * @param permissionName - 权限名称 (如: 'order.own.edit')
 * @param options - 可选配置 (审计记录等)
 */
export const requirePermission = async (
  session: Session | null,
  permissionName: string,
  options?: CheckPermissionOptions
): Promise<void> => {
  const hasPermission = await checkPermission(session, permissionName, options);
  if (!hasPermission) {
    throw new Error('无权限');
  }
};

/**
 * 内部权限检查（带缓存）
 *
 * 支持三种匹配模式：
 * 1. 精确匹配：权限名完全一致
 * 2. 通配符匹配：角色拥有 '*' 或 '**' 权限
 * 3. 数据范围层级推导：`order.own.edit` 或 `order.all.edit` 隐式包含 `order.edit`
 *    这解决了 Server Actions 使用通用权限名（如 `order.edit`），
 *    而角色配置使用数据范围权限名（如 `order.own.edit`）的不匹配问题。
 */
const checkRolePermission = async (session: Session, permissionName: string): Promise<boolean> => {
  const getRolePermissions = unstable_cache(
    async (roleCode: string, tenantId: string) => {
      // 1. 对于平台管理员角色，或者处于平台租户环境，直接跳过查库（因为 tenantId 为非 UUID 格式的 __PLATFORM__ 会导致 Postgres 报错）
      if (roleCode === 'PLATFORM_ADMIN' || tenantId === '__PLATFORM__') {
        return ['**']; // 返回包含所有权限的通配符
      }

      const role = await db.query.roles.findFirst({
        where: and(eq(roles.code, roleCode), eq(roles.tenantId, tenantId)),
        columns: {
          permissions: true,
        },
      });
      return role?.permissions || [];
    },
    ['role-permissions'],
    { revalidate: 300, tags: ['roles'] }
  );

  try {
    // 并行检查所有角色的权限
    const results = await Promise.all(
      (session.user.roles || []).map((role) => getRolePermissions(role, session.user.tenantId))
    );

    // 合并所有角色的权限
    const allPermissions = new Set(results.flat());

    // 1. 精确匹配
    if (allPermissions.has(permissionName)) return true;

    // 2. 通配符匹配
    if (allPermissions.has('*') || allPermissions.has('**')) return true;

    // 3. 数据范围层级推导
    //    如果检查的是通用权限（如 `order.edit`），
    //    而用户拥有对应的数据范围权限（如 `order.own.edit` 或 `order.all.edit`），
    //    则认为权限匹配成功。
    //    格式：{module}.{action} → 检查 {module}.own.{action} 或 {module}.all.{action}
    const parts = permissionName.split('.');
    if (parts.length === 2) {
      const [module, action] = parts;
      if (
        allPermissions.has(`${module}.own.${action}`) ||
        allPermissions.has(`${module}.all.${action}`)
      ) {
        return true;
      }
    }

    // 4. 如果请求的范围权限是 own（如 order.own.edit），
    //    但用户拥有更高阶的 all 权限（如 order.all.edit），则必然放行。
    if (parts.length === 3 && parts[1] === 'own') {
      const [module, _scope, action] = parts;
      if (allPermissions.has(`${module}.all.${action}`)) {
        return true;
      }
    }

    return false;
  } catch (e) {
    logger.error('Permission check failed', e);
    return false;
  }
};
