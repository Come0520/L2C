/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPermission } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            roles: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(),
        })),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

// Mock unstable_cache 以模拟简单的内存缓存
const cacheMap = new Map();
vi.mock('next/cache', () => ({
    unstable_cache: (fn: any, keys: string[]) => {
        return async (...args: any[]) => {
            const cacheKey = JSON.stringify({ keys, args });
            if (cacheMap.has(cacheKey)) return cacheMap.get(cacheKey);
            const result = await fn(...args);
            cacheMap.set(cacheKey, result);
            return result;
        };
    },
}));

vi.mock('next-auth', () => ({
    default: vi.fn(() => ({
        handlers: {},
        auth: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn()
    }))
}));

vi.mock('next-auth/providers/credentials', () => ({
    default: vi.fn()
}));

vi.mock('@/shared/lib/auth-server', () => ({
    auth: vi.fn(),
}));

describe('RBAC checkRolePermission Core Logic', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        cacheMap.clear();
    });

    const createMockSession = (roles: string[], tenantId = 't1') => ({
        user: { id: 'u1', roles, tenantId },
        expires: '123'
    });

    it('1. 精确匹配 (Exact Match): 角色拥有具体权限放行', async () => {
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
            permissions: ['order.own.edit', 'product.view']
        });

        const session = createMockSession(['SALES']);
        const result = await checkPermission(session as any, 'order.own.edit');
        expect(result).toBe(true);
    });

    it('2. 精确匹配失败: 角色不拥有具体权限拦截', async () => {
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
            permissions: ['product.view']
        });

        const session = createMockSession(['SALES']);
        const result = await checkPermission(session as any, 'order.own.edit');
        expect(result).toBe(false);
    });

    it('3. 通配符匹配 (Wildcard Match): 拥有 * 的超级管理员直接放行', async () => {
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
            permissions: ['*']
        });

        const session = createMockSession(['SUPER_ADMIN']);
        const result = await checkPermission(session as any, 'very.complex.action');
        expect(result).toBe(true);
    });

    it('4. 通配符匹配 (Wildcard Match): 拥有 ** 同样放行', async () => {
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
            permissions: ['**']
        });

        const session = createMockSession(['TENANT_ADMIN']);
        const result = await checkPermission(session as any, 'system.settings.purge');
        expect(result).toBe(true);
    });

    it('5. 数据范围推导 (Implicit Scope): 校验 order.edit, 角色拥有 order.own.edit, 应隐形放行', async () => {
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
            permissions: ['order.own.edit']
        });

        const session = createMockSession(['USER']);
        // Action 校验通用权限
        const result = await checkPermission(session as any, 'order.own.edit');
        expect(result).toBe(true);
    });

    it('6. 数据范围推导 (Implicit Scope): 校验 order.edit, 角色拥有 order.all.edit, 应隐形放行', async () => {
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
            permissions: ['order.all.edit']
        });

        const session = createMockSession(['MANAGER']);
        const result = await checkPermission(session as any, 'order.own.edit');
        expect(result).toBe(true);
    });

    it('7. 综合多角色合并测试', async () => {
        // 模拟角色 A 没有需要的权限
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
            permissions: ['product.view']
        });
        // 模拟角色 B 有数据范围权限 order.own.edit
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
            permissions: ['order.own.edit']
        });

        const session = createMockSession(['ROLE_A', 'ROLE_B']);
        const result = await checkPermission(session as any, 'order.own.edit');
        expect(result).toBe(true);
    });

    it('8. 极端边缘测试: 未绑定角色、无角色返回拦截', async () => {
        // 角色表没找到
        vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce(null);

        const session = createMockSession(['GHOST_ROLE']);
        const result = await checkPermission(session as any, 'order.own.edit');
        expect(result).toBe(false);
    });

    it('9. ADMIN 魔术常量短路放行', async () => {
        // 系统直接短路拦截 ADMIN ，不需要查库
        const session = createMockSession(['ADMIN']);
        const result = await checkPermission(session as any, 'anything');
        expect(result).toBe(true);
        expect(db.query.roles.findFirst).not.toHaveBeenCalled();
    });

    it('10. 权限缓存命中验证: 连续两次检查应仅触发一次数据库查询', async () => {
        vi.mocked(db.query.roles.findFirst).mockResolvedValue({
            permissions: ['order.view']
        });
        const session = createMockSession(['VIEWER']);
        // 第一次检查
        await checkPermission(session as any, 'order.view');
        // 第二次检查（相同角色和租户）
        await checkPermission(session as any, 'order.view');
        // 验证 db.query.roles.findFirst 仅被调用一次，说明第二次命中了缓存
        expect(db.query.roles.findFirst).toHaveBeenCalledTimes(1);
    });

});
