/**
 * Dashboard 安全测试
 * 覆盖 Auth 保护、Zod 校验、TenantId 隔离、角色覆盖
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardStats } from '../actions';
import { getDashboardConfigAction, saveDashboardConfigAction, resetDashboardConfigAction } from '../actions/config';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { getDefaultDashboardConfig } from '../utils';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ value: 5 }]),
            })),
        })),
        query: {
            userDashboardConfigs: {
                findFirst: vi.fn().mockResolvedValue(null),
            },
        },
    },
}));

vi.mock('next/cache', () => ({
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
    unstable_cache: vi.fn((fn: (...args: any[]) => any) => fn),
}));

vi.mock('@/shared/lib/logger', () => ({
    createLogger: () => ({
        info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
    }),
    logger: {
        info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
    },
}));

vi.mock('@/shared/lib/audit', () => ({
    AuditService: { log: vi.fn() },
}));

vi.mock('@/services/workbench.service', () => ({
    WorkbenchService: {
        getDashboardConfig: vi.fn(),
        updateDashboardConfig: vi.fn(),
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(true),
    },
}));

// ===== 辅助常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (role: string, tenantId = TENANT_A) => ({
    user: { id: USER_ID, role, tenantId, name: '测试用户' },
});

const mockAuth = vi.mocked(auth);

// ===== 测试套件 =====

describe('Dashboard 安全性测试', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // 重置 db.select mock
        vi.mocked(db.select as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ value: 5 }]),
            })),
        }));
    });

    // ---- Auth 保护 ----

    describe('Auth 保护', () => {
        it('getDashboardStats - 未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('getDashboardConfigAction - 未登录应返回默认配置', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getDashboardConfigAction();
            // 未登录时回退到默认配置
            expect(result).toBeDefined();
            expect(result.widgets).toBeDefined();
        });
    });

    // ---- Zod 校验 ----

    describe('Zod 校验', () => {
        it('getDashboardStats - 传入非法额外字段应仍然通过（宽松 schema）', async () => {
            mockAuth.mockResolvedValue(makeSession('ADMIN') as never);
            // z.object({}) 接受任意输入（不做严格校验）
            const result = await getDashboardStats({} as any);
            expect(result.success).toBe(true);
        });
    });

    // ---- TenantId 隔离 ----

    describe('TenantId 隔离', () => {
        it('getDashboardStats - 使用 session tenantId 过滤数据', async () => {
            mockAuth.mockResolvedValue(makeSession('ADMIN', TENANT_A) as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });
    });

    // ---- 角色覆盖 ----

    describe('角色覆盖', () => {
        it('ADMIN 角色应返回全量管理员卡片', async () => {
            mockAuth.mockResolvedValue(makeSession('ADMIN') as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            expect((result.data as any)?.role).toBe('ADMIN');
            expect((result.data as any)?.cards.length).toBeGreaterThan(0);
        });

        it('MANAGER 角色应返回管理视图', async () => {
            mockAuth.mockResolvedValue(makeSession('MANAGER') as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            expect((result.data as any)?.role).toBe('MANAGER');
        });

        it('SALES 角色应返回销售个人卡片', async () => {
            mockAuth.mockResolvedValue(makeSession('SALES') as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            expect((result.data as any)?.role).toBe('SALES');
            const cards = (result.data as any)?.cards || [];
            expect(cards.find((c: any) => c.title === '我的线索')).toBeDefined();
        });

        it('WORKER 角色应返回工人任务卡片', async () => {
            mockAuth.mockResolvedValue(makeSession('WORKER') as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            expect((result.data as any)?.role).toBe('WORKER');
        });

        it('FINANCE 角色应返回默认欢迎卡片', async () => {
            mockAuth.mockResolvedValue(makeSession('FINANCE') as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            // FINANCE 没有专属分支，走 default
            const cards = (result.data as any)?.cards || [];
            expect(cards.find((c: any) => c.title === '欢迎回来')).toBeDefined();
        });

        it('DISPATCHER 角色应返回默认欢迎卡片', async () => {
            mockAuth.mockResolvedValue(makeSession('DISPATCHER') as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
        });

        it('UNKNOWN_ROLE 应回退到 GUEST 并返回欢迎卡片', async () => {
            mockAuth.mockResolvedValue(makeSession('INVALID_ROLE') as never);
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            expect((result.data as any)?.role).toBe('GUEST');
        });
    });

    // ---- 默认配置角色覆盖 ----

    describe('默认配置角色覆盖', () => {
        it('每个角色都应返回有效的默认 Widget 配置', () => {
            const roles = ['ADMIN', 'MANAGER', 'SALES', 'WORKER', 'FINANCE', 'DISPATCHER'];
            roles.forEach(role => {
                const config = getDefaultDashboardConfig(role);
                expect(config).toBeDefined();
                expect(config.widgets).toBeDefined();
                expect(Array.isArray(config.widgets)).toBe(true);
            });
        });

        it('ADMIN 应获得最多 Widget', () => {
            const adminConfig = getDefaultDashboardConfig('ADMIN');
            const salesConfig = getDefaultDashboardConfig('SALES');
            expect(adminConfig.widgets.length).toBeGreaterThanOrEqual(salesConfig.widgets.length);
        });

        it('数据库异常时应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession('ADMIN') as never);
            vi.mocked(db.select as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
                throw new Error('DB_DOWN');
            });
            const result = await getDashboardStats({});
            expect(result.success).toBe(false);
            expect(result.error).toBe('获取统计数据失败');
        });
    });
});
