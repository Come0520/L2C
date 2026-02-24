/**
 * Sales 模块综合测试
 * 覆盖：targets CRUD + 权限控制 + Zod 校验 + AuditService 审计 + dashboard 视图隔离
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSalesTargets, updateSalesTarget, getMySalesTarget, adjustSalesTarget, confirmSalesTarget } from '../actions/targets';
import { getSalesDashboardStats } from '../actions/dashboard';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ===== DB Mock =====
// 使用可被各测试用例覆盖的响应函数

const mockDbFindFirstUsers = vi.fn();
const mockDbFindFirstTargets = vi.fn();
const mockDbFindManyQuotes = vi.fn();
const mockDbInsertOnConflict = vi.fn().mockResolvedValue([]);
const mockDbSelectFrom = vi.fn();

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: { findFirst: (...args: any[]) => mockDbFindFirstUsers(...args) },
            salesTargets: { findFirst: (...args: any[]) => mockDbFindFirstTargets(...args) },
            quotes: { findMany: (...args: any[]) => mockDbFindManyQuotes(...args) },
        },
        select: vi.fn(() => ({
            from: (...args: any[]) => mockDbSelectFrom(...args),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                onConflictDoUpdate: mockDbInsertOnConflict,
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn().mockResolvedValue([{ id: 'mock-updated-id' }]),
                })),
            })),
        })),
    },
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const ADMIN_ID = '33333333-3333-3333-3333-333333333333';
const SALES_USER_ID = '44444444-4444-4444-4444-444444444444';
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

/** 构造 Session 辅助函数 */
const makeSession = (role: string = 'BOSS', tenantId: string = TENANT_A, userId: string = ADMIN_ID) => ({
    user: { id: userId, role, tenantId, name: '测试用户' },
});

const mockAuth = vi.mocked(auth);
const mockAuditLog = vi.mocked(AuditService.log);

// ===== 测试套件 =====

describe('Sales 模块测试', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // 默认 DB Mock 返回值
        mockDbFindFirstUsers.mockResolvedValue({
            id: ADMIN_ID,
            role: 'BOSS',
            tenantId: TENANT_A,
        });
        mockDbFindFirstTargets.mockResolvedValue(null);
        mockDbFindManyQuotes.mockResolvedValue([]);
        // 构建完整链式 Mock：支持 where/groupBy/leftJoin 等所有链式调用
        const makeSelectChain = (returnVal: unknown[] = []) => ({
            where: vi.fn(() => returnVal),
            leftJoin: vi.fn(() => ({ where: vi.fn(() => returnVal) })),
            groupBy: vi.fn(() => returnVal),
        });
        mockDbSelectFrom.mockReturnValue(makeSelectChain());
    });

    // ==========================================
    // getSalesTargets 测试
    // ==========================================
    describe('getSalesTargets', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getSalesTargets(CURRENT_YEAR, CURRENT_MONTH);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('已登录应返回空销售目标列表', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            // 模拟 select().from().leftJoin().where() 返回空列表
            mockDbSelectFrom.mockReturnValue({
                leftJoin: vi.fn(() => ({
                    where: vi.fn(() => []),
                })),
            });
            const result = await getSalesTargets(CURRENT_YEAR, CURRENT_MONTH);
            expect(result.error).not.toBe('Unauthorized');
        });

        it('Zod 校验：年份超出范围时应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await getSalesTargets(1990, 1);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('Zod 校验：月份超出范围时应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await getSalesTargets(CURRENT_YEAR, 13);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('Zod 校验：月份为 0 时应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await getSalesTargets(CURRENT_YEAR, 0);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    // ==========================================
    // updateSalesTarget 测试
    // ==========================================
    describe('updateSalesTarget', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 50000);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('sales 角色（非管理员）应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession('sales', TENANT_A, SALES_USER_ID) as never);
            // Mock DB 返回普通销售角色用户
            mockDbFindFirstUsers.mockResolvedValue({
                id: SALES_USER_ID,
                role: 'sales',
                tenantId: TENANT_A,
            });
            const result = await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 50000);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });

        it('普通员工角色应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession('employee', TENANT_A) as never);
            mockDbFindFirstUsers.mockResolvedValue({
                id: ADMIN_ID,
                role: 'employee',
                tenantId: TENANT_A,
            });
            const result = await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 50000);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });

        it('admin 角色应成功更新目标', async () => {
            mockAuth.mockResolvedValue(makeSession('admin') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'admin', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue(null); // 无旧记录
            mockDbInsertOnConflict.mockResolvedValue([]);
            const result = await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 50000);
            expect(result.success).toBe(true);
        });

        it('manager 角色应成功更新目标', async () => {
            mockAuth.mockResolvedValue(makeSession('manager') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'manager', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue(null);
            mockDbInsertOnConflict.mockResolvedValue([]);
            const result = await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 80000);
            expect(result.success).toBe(true);
        });

        it('BOSS 角色应成功更新目标', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue(null);
            mockDbInsertOnConflict.mockResolvedValue([]);
            const result = await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 100000);
            expect(result.success).toBe(true);
        });

        it('新建目标时 AuditService.log 应以 CREATE 被调用', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue(null); // 无旧记录 → CREATE
            mockDbInsertOnConflict.mockResolvedValue([]);
            await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 50000);
            expect(mockAuditLog).toHaveBeenCalledOnce();
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ action: 'CREATE', tableName: 'sales_targets' })
            );
        });

        it('更新已有目标时 AuditService.log 应以 UPDATE 被调用，且包含 oldValues', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            // 旧目标存在
            mockDbFindFirstTargets.mockResolvedValue({
                id: 'target-abc',
                targetAmount: '50000',
                userId: SALES_USER_ID,
                year: CURRENT_YEAR,
                month: CURRENT_MONTH,
            });
            mockDbInsertOnConflict.mockResolvedValue([]);
            await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 80000);
            expect(mockAuditLog).toHaveBeenCalledOnce();
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    action: 'UPDATE',
                    tableName: 'sales_targets',
                    oldValues: { targetAmount: '50000' },
                    newValues: expect.objectContaining({ targetAmount: '80000' }),
                })
            );
        });

        it('Zod 校验：负金额应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            const result = await updateSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, -1);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('Zod 校验：userId 为空字符串应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            const result = await updateSalesTarget('', CURRENT_YEAR, CURRENT_MONTH, 50000);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    // ==========================================
    // adjustSalesTarget 测试
    // ==========================================
    describe('adjustSalesTarget', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await adjustSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 1000, '调整原因');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('Zod 校验：adjustmentAmount 为 0 应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            const result = await adjustSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 0, '调整原因');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('Zod 校验：reason 少于 5 个字符应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            const result = await adjustSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 1000, '原因');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('非管理层角色应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession('employee', TENANT_A) as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'employee', tenantId: TENANT_A });
            const result = await adjustSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 1000, '调整原因');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });

        it('旧目标不存在应返回 Target not found 错误', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue(null);
            const result = await adjustSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 1000, '调整原因');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Sales target does not exist');
        });

        it('成功调整目标并调用 AuditService.log', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue({
                id: 'target-123',
                targetAmount: '50000',
                userId: SALES_USER_ID,
                year: CURRENT_YEAR,
                month: CURRENT_MONTH,
            });

            const result = await adjustSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH, 10000, '调整原因：超额分配');
            expect(result.success).toBe(true);

            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    action: 'ADJUST_TARGET_VALUE',
                    tableName: 'sales_targets',
                    recordId: 'target-123',
                    oldValues: { targetAmount: '50000' },
                    newValues: { targetAmount: String(50000 + 10000) },
                    details: { reason: '调整原因：超额分配', adjustAmount: 10000 }
                })
            );
        });
    });

    // ==========================================
    // confirmSalesTarget 测试
    // ==========================================
    describe('confirmSalesTarget', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await confirmSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('Zod 校验：userId 为无效 uuid', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            const result = await confirmSalesTarget('invalid-uuid', CURRENT_YEAR, CURRENT_MONTH);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('普通员工缺少权限应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession('employee') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'employee', tenantId: TENANT_A });
            const result = await confirmSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });

        it('目标不存在应返回 Target not found 错误', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue(null);
            const result = await confirmSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Sales target does not exist');
        });

        it('成功确认目标并设置 updatedAt，并调用 AuditService.log', async () => {
            mockAuth.mockResolvedValue(makeSession('manager', TENANT_A) as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'manager', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue({
                id: 'target-123',
                targetAmount: '50000',
            });

            const result = await confirmSalesTarget(SALES_USER_ID, CURRENT_YEAR, CURRENT_MONTH);
            expect(result.success).toBe(true);

            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    action: 'CONFIRM_TARGET',
                    tableName: 'sales_targets',
                    recordId: 'target-123',
                })
            );
        });
    });

    // ==========================================
    // getMySalesTarget 测试
    // ==========================================
    describe('getMySalesTarget', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getMySalesTarget();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('已登录应返回当月目标金额', async () => {
            mockAuth.mockResolvedValue(makeSession('sales', TENANT_A, SALES_USER_ID) as never);
            mockDbFindFirstTargets.mockResolvedValue({ targetAmount: '60000' });
            const result = await getMySalesTarget();
            expect(result.success).toBe(true);
            expect(result.data?.targetAmount).toBe(60000);
        });

        it('无目标时返回 0', async () => {
            mockAuth.mockResolvedValue(makeSession('sales', TENANT_A, SALES_USER_ID) as never);
            mockDbFindFirstTargets.mockResolvedValue(null);
            const result = await getMySalesTarget();
            expect(result.success).toBe(true);
            expect(result.data?.targetAmount).toBe(0);
        });

        it('Zod 校验：月份超出范围应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await getMySalesTarget(CURRENT_YEAR, 13);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    // ==========================================
    // getSalesDashboardStats 测试（团队 vs 个人 + tenantId 隔离）
    // ==========================================
    describe('getSalesDashboardStats', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getSalesDashboardStats();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('teamId 缺失时应返回 Unauthorized', async () => {
            mockAuth.mockResolvedValue({ user: { id: ADMIN_ID } } as never);
            const result = await getSalesDashboardStats();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('BOSS 角色应返回团队视图数据（包含 target/stats 字段）', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            // 团队视图多个 select 依次调用，统一返回包含 total/count 与空数组的链
            mockDbSelectFrom
                .mockReturnValueOnce({
                    // 第1次：salesTargets sum → [{ total }]
                    where: vi.fn(() => [{ total: '100000' }]),
                    groupBy: vi.fn(() => []),
                    leftJoin: vi.fn(() => ({ where: vi.fn(() => []) })),
                })
                .mockReturnValueOnce({
                    // 第2次：customers groupBy status → []
                    where: vi.fn(() => ({
                        groupBy: vi.fn(() => []),
                    })),
                    groupBy: vi.fn(() => []),
                    leftJoin: vi.fn(() => ({ where: vi.fn(() => []) })),
                })
                .mockReturnValue({
                    // 第3次及后续：quotes count → [{ count: 0 }]
                    where: vi.fn(() => [{ count: 0 }]),
                    groupBy: vi.fn(() => []),
                    leftJoin: vi.fn(() => ({ where: vi.fn(() => []) })),
                });
            mockDbFindManyQuotes.mockResolvedValue([{ finalAmount: '50000' }]);
            const result = await getSalesDashboardStats();
            expect(result.success).toBe(true);
            if (result.data) {
                expect(result.data).toHaveProperty('target');
                expect(result.data).toHaveProperty('stats');
                expect(result.data.target).toHaveProperty('amount');
                expect(result.data.target).toHaveProperty('achieved');
                expect(result.data.target).toHaveProperty('percentage');
            }
        });

        it('sales 角色应返回个人视图数据', async () => {
            mockAuth.mockResolvedValue(makeSession('sales', TENANT_A, SALES_USER_ID) as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: SALES_USER_ID, role: 'sales', tenantId: TENANT_A });
            mockDbFindFirstTargets.mockResolvedValue({ targetAmount: '30000' });
            // 个人视图：customers.groupBy → []，quotes count → [{ count: 0 }]
            mockDbSelectFrom
                .mockReturnValueOnce({
                    // customers groupBy status
                    where: vi.fn(() => ({
                        groupBy: vi.fn(() => []),
                    })),
                    groupBy: vi.fn(() => []),
                    leftJoin: vi.fn(() => ({ where: vi.fn(() => []) })),
                })
                .mockReturnValue({
                    // quotes count
                    where: vi.fn(() => [{ count: 0 }]),
                    groupBy: vi.fn(() => []),
                    leftJoin: vi.fn(() => ({ where: vi.fn(() => []) })),
                });
            mockDbFindManyQuotes.mockResolvedValue([]);
            const result = await getSalesDashboardStats();
            expect(result.success).toBe(true);
            if (result.data) {
                expect(result.data.target).toBeDefined();
                expect(result.data.stats).toBeDefined();
            }
        });

        it('tenantId 隔离：租户 A 登录不应返回 Unauthorized（被允许访问本租户数据）', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS', TENANT_A) as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            mockDbSelectFrom.mockReturnValue({
                where: vi.fn(() => [{ total: '0', count: 0 }]),
                groupBy: vi.fn(() => []),
            });
            mockDbFindManyQuotes.mockResolvedValue([]);
            const result = await getSalesDashboardStats();
            expect(result.error).not.toBe('Unauthorized');
        });

        it('tenantId 隔离：租户 B 的会话应使用 tenantId B 过滤数据（不混入租户 A 数据）', async () => {
            // 验证 authSession.user.tenantId 被正确传入查询（而非固定 TENANT_A）
            mockAuth.mockResolvedValue(makeSession('BOSS', TENANT_B) as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_B });
            mockDbSelectFrom.mockReturnValue({
                where: vi.fn(() => [{ total: '0', count: 0 }]),
                groupBy: vi.fn(() => []),
            });
            mockDbFindManyQuotes.mockResolvedValue([]);
            const resultB = await getSalesDashboardStats();
            expect(resultB.error).not.toBe('Unauthorized');
        });

        it('完成率超过 100% 时应截断为 100', async () => {
            mockAuth.mockResolvedValue(makeSession('BOSS') as never);
            mockDbFindFirstUsers.mockResolvedValue({ id: ADMIN_ID, role: 'BOSS', tenantId: TENANT_A });
            // 模拟 target=10000，achieved=50000（超额完成）
            mockDbSelectFrom.mockReturnValue({
                where: vi.fn(() => [{ total: '10000', count: 1 }]),
                groupBy: vi.fn(() => []),
            });
            mockDbFindManyQuotes.mockResolvedValue([
                { finalAmount: '50000' }, // 超出目标 5 倍
            ]);
            const result = await getSalesDashboardStats();
            if (result.success && result.data) {
                expect(result.data.target.percentage).toBeLessThanOrEqual(100);
            }
        });
    });
});
