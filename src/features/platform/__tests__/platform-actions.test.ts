/**
 * Platform 模块 L4 升级扩展测试
 *
 * 覆盖范围：
 * ─ admin-actions.ts ─
 * - approveTenant：非平台管理员不能审批；租户不存在时报错；状态非 pending_approval 时拒绝；正常审批成功
 * - rejectTenant：拒绝原因为空时返回错误；正常拒绝成功
 * - suspendTenant：暂停租户成功
 * - activateTenant：非暂停状态不允许恢复
 * ─ tenant-registration.ts ─
 * - 注册频率限制（24小时内超过3次被拒）
 * - 重复注册检测（手机号或邮箱已存在）
 * - Zod 校验（无效邮箱、密码格式）
 * - 正常注册成功
 * ─ L5 深度测试 ─
 * - 认证审核流程（approveVerification/rejectVerification）
 * - AuditService.record 调用验证
 * - 平台统计 Analytics（getPlatformOverview/getRegistrationTrend）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** ─────────── Hoisted Mock Refs ─────────── */
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    dbQueryUsersFindFirst: vi.fn(),
    dbQueryUsersFindMany: vi.fn(),
    dbQueryTenantsFindFirst: vi.fn(),
    dbQueryTenantsFindMany: vi.fn(),
    dbExecute: vi.fn(),
    dbInsert: vi.fn(),
    auditRecord: vi.fn(),
    notifyApproved: vi.fn(),
    notifyRejected: vi.fn(),
    sendEmail: vi.fn(),
    hash: vi.fn(),
    nanoid: vi.fn(),
    checkRateLimit: vi.fn(),
    // 站内通知服务 Mock
    notificationServiceSend: vi.fn(),
}));

/** ─────────── 全局 Mock 配置 ─────────── */

vi.mock('@/shared/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('127.0.0.1'),
    }),
}));
vi.mock('@/shared/middleware/rate-limit', () => ({
    checkRateLimit: mocks.checkRateLimit,
}));

// DB mock - 支持事务
const txChain = () => ({
    query: {
        tenants: { findFirst: mocks.dbQueryTenantsFindFirst },
    },
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    insert: vi.fn(() => ({
        values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'new-tenant-id' }]),
        })),
    })),
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: {
                findFirst: mocks.dbQueryUsersFindFirst,
                findMany: mocks.dbQueryUsersFindMany,
            },
            tenants: {
                findFirst: mocks.dbQueryTenantsFindFirst,
                findMany: mocks.dbQueryTenantsFindMany,
            },
        },
        execute: mocks.dbExecute,
        transaction: vi.fn(async (fn: (tx: ReturnType<typeof txChain>) => Promise<unknown>) => fn(txChain())),
        insert: mocks.dbInsert,
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mocks.auditRecord.mockResolvedValue(undefined) },
}));

vi.mock('@/services/wechat-subscribe-message.service', () => ({
    notifyTenantApproved: mocks.notifyApproved.mockResolvedValue(undefined),
    notifyTenantRejected: mocks.notifyRejected.mockResolvedValue(undefined),
}));

vi.mock('@/shared/lib/email', () => ({
    sendEmail: mocks.sendEmail.mockResolvedValue(undefined),
}));

// 站内通知服务 Mock（直接发送模式）
vi.mock('@/features/notifications/service', () => ({
    notificationService: {
        send: mocks.notificationServiceSend.mockResolvedValue(true),
    },
}));

vi.mock('@/shared/lib/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/lib/utils')>();
    return { ...actual, formatDate: vi.fn().mockReturnValue('2026-02-21') };
});

vi.mock('bcryptjs', () => ({ hash: mocks.hash.mockResolvedValue('hashed-pw') }));
vi.mock('nanoid', () => ({ nanoid: mocks.nanoid.mockReturnValue('TESTCODE') }));

/** ─────────── 常量 ─────────── */
const ADMIN_USER_ID = 'admin-user-001';
const TENANT_ID = 'tenant-001';

/** ─────────── 测试套件 ─────────── */

describe('Platform Actions - L4 升级测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 默认行为：已登录的平台管理员
        mocks.auth.mockResolvedValue({ user: { id: ADMIN_USER_ID } });
        mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: true });
        mocks.dbQueryTenantsFindMany.mockResolvedValue([]);
        mocks.dbQueryUsersFindMany.mockResolvedValue([]);
        mocks.dbExecute.mockResolvedValue([{ count: 0 }]);
        mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 5, limit: 5, source: 'memory', resetAt: new Date() });
    });

    // ═══════════════════════════════════════════
    //  admin-actions.ts 测试
    // ═══════════════════════════════════════════

    describe('approveTenant - 审批通过租户', () => {
        it('未登录时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);
            const { approveTenant } = await import('../actions/admin-actions');
            const result = await approveTenant(TENANT_ID);
            expect(result.success).toBe(false);
            expect(result.error).toContain('未登录');
        }, 10000); // 首次模块加载需要更多时间

        it('非平台管理员应返回无权限错误', async () => {
            mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: false });
            const { approveTenant } = await import('../actions/admin-actions');
            const result = await approveTenant(TENANT_ID);
            expect(result.success).toBe(false);
            expect(result.error).toContain('权限');
        }, 10000); // 首次模块加载兜底超时

        it('租户不存在时应返回错误', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue(null);
            const { approveTenant } = await import('../actions/admin-actions');
            const result = await approveTenant('nonexistent-id');
            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });

        it('租户状态非 pending_approval 时应拒绝', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ status: 'active', name: 'Test' });
            const { approveTenant } = await import('../actions/admin-actions');
            const result = await approveTenant(TENANT_ID);
            expect(result.success).toBe(false);
            expect(result.error).toContain('active');
        });

        it('正常审批应返回成功', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ status: 'pending_approval', name: 'Test Corp' });
            const { approveTenant } = await import('../actions/admin-actions');
            const result = await approveTenant(TENANT_ID);
            expect(result.success).toBe(true);
        });
    });

    describe('rejectTenant - 拒绝租户申请', () => {
        it('拒绝原因为空时应返回错误', async () => {
            const { rejectTenant } = await import('../actions/admin-actions');
            const result = await rejectTenant(TENANT_ID, '');
            expect(result.success).toBe(false);
            expect(result.error).toContain('拒绝原因');
        });

        it('拒绝原因仅空格时应返回错误', async () => {
            const { rejectTenant } = await import('../actions/admin-actions');
            const result = await rejectTenant(TENANT_ID, '   ');
            expect(result.success).toBe(false);
            expect(result.error).toContain('拒绝原因');
        });

        it('正常拒绝应返回成功', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ status: 'pending_approval' });
            const { rejectTenant } = await import('../actions/admin-actions');
            const result = await rejectTenant(TENANT_ID, '信息不完整');
            expect(result.success).toBe(true);
        });
    });

    describe('suspendTenant - 暂停租户', () => {
        it('平台管理员应能暂停租户', async () => {
            const { suspendTenant } = await import('../actions/admin-actions');
            const result = await suspendTenant(TENANT_ID, '违规操作');
            expect(result.success).toBe(true);
        });

        it('非平台管理员不能暂停租户', async () => {
            mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: false });
            const { suspendTenant } = await import('../actions/admin-actions');
            const result = await suspendTenant(TENANT_ID);
            expect(result.success).toBe(false);
        });
    });

    describe('activateTenant - 恢复租户', () => {
        it('非暂停状态不应允许恢复', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ status: 'active' });
            const { activateTenant } = await import('../actions/admin-actions');
            const result = await activateTenant(TENANT_ID);
            expect(result.success).toBe(false);
            expect(result.error).toContain('无需恢复');
        });

        it('暂停状态应允许恢复', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ status: 'suspended' });
            const { activateTenant } = await import('../actions/admin-actions');
            const result = await activateTenant(TENANT_ID);
            expect(result.success).toBe(true);
        });
    });

    describe('getAllTenants - 分页查询', () => {
        it('应支持默认分页参数', async () => {
            const { getAllTenants } = await import('../actions/admin-actions');
            const result = await getAllTenants();
            expect(result.success).toBe(true);
        });
    });

    // ═══════════════════════════════════════════
    //  tenant-registration.ts 测试
    // ═══════════════════════════════════════════

    describe('submitTenantApplication - 分布式限流 (L5 增强)', () => {
        beforeEach(() => {
            // 提交申请时，findFirst(users) 用于检查手机号/邮箱唯一性，需返回 null 表示未占用
            mocks.dbQueryUsersFindFirst.mockResolvedValue(null);
            mocks.dbQueryTenantsFindMany.mockResolvedValue([]);
        });

        it('当 IP 限流触发时 (allowed: false) 应拒绝注册', async () => {
            mocks.checkRateLimit.mockResolvedValue({
                allowed: false,
                remaining: 0,
                limit: 5,
                source: 'memory',
                resetAt: new Date(),
            });

            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: '被限流企业',
                applicantName: '张三',
                phone: '13811112222',
                email: 'rl@test.com',
                password: 'Pass1234',
                region: '北京',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('频繁');
        });

        it('当限流检查异常时应降级放行 (Resilience)', async () => {
            mocks.checkRateLimit.mockRejectedValue(new Error('Redis Down'));

            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: '降级放行企业',
                applicantName: '李四',
                phone: '13833334444',
                email: 'resilience@test.com',
                password: 'Pass1234',
                region: '上海',
            });

            // 如果报错后正常走后面流程返回成功，说明降级逻辑生效（不应让限流组件的异常导致业务中断）
            expect(result.success).toBe(true);
        });
    });

    describe('submitTenantApplication - 注册频率限制', () => {
        it('24小时内超过3次申请应被拒绝', async () => {
            // 模拟已有3条最近申请
            mocks.dbQueryTenantsFindMany.mockResolvedValue([
                { id: '1' }, { id: '2' }, { id: '3' },
            ]);

            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: '频繁申请企业',
                applicantName: '张三',
                phone: '13800138000',
                email: 'freq@test.com',
                password: 'Pass1234',
                region: '杭州',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('频繁');
        });
    });

    describe('submitTenantApplication - 重复注册检测', () => {
        it('手机号已存在时应返回错误', async () => {
            mocks.dbQueryUsersFindFirst.mockResolvedValue({ id: 'existing-user' });

            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: '重复企业',
                applicantName: '李四',
                phone: '13900139000',
                email: 'dup@test.com',
                password: 'Pass1234',
                region: '上海',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('已被注册');
        });
    });

    describe('submitTenantApplication - Zod 校验', () => {
        it('无效邮箱应返回错误', async () => {
            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: '测试企业',
                applicantName: '张三',
                phone: '13800138000',
                email: 'invalid-email',
                password: 'Pass1234',
                region: '杭州',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('邮箱');
        });

        it('密码缺少数字应返回错误', async () => {
            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: '测试企业',
                applicantName: '张三',
                phone: '13800138000',
                email: 'test@example.com',
                password: 'NoNumbers',
                region: '杭州',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('密码');
        });

        it('企业名称过短应返回错误', async () => {
            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: 'A',
                applicantName: '张三',
                phone: '13800138000',
                email: 'test@example.com',
                password: 'Pass1234',
                region: '杭州',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('企业名称');
        });
    });

    describe('submitTenantApplication - 正常注册', () => {
        it('所有条件满足时应注册成功', async () => {
            // 确保无重复
            mocks.dbQueryUsersFindFirst.mockResolvedValue(null);
            mocks.dbQueryTenantsFindMany.mockResolvedValue([]);

            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: '合法企业有限公司',
                applicantName: '王五',
                phone: '13800138000',
                email: 'legit@company.com',
                password: 'Secure123',
                region: '深圳',
            });

            expect(result.success).toBe(true);
            expect(result.tenantId).toBe('new-tenant-id');
        });

        it('注册成功后应向平台管理员发送站内通知', async () => {
            // 模拟平台管理员存在（需要带 id，供通知服务使用）
            mocks.dbQueryUsersFindFirst.mockResolvedValue(null);
            mocks.dbQueryTenantsFindMany.mockResolvedValue([]);
            mocks.dbQueryUsersFindMany.mockResolvedValue([
                { id: 'admin-001', email: 'admin@platform.com', name: '平台管理员', tenantId: null },
            ]);

            const { submitTenantApplication } = await import('../actions/tenant-registration');
            const result = await submitTenantApplication({
                companyName: '测试通知企业',
                applicantName: '赵六',
                phone: '13700137000',
                email: 'notify@test.com',
                password: 'Secure123',
                region: '北京',
            });

            expect(result.success).toBe(true);

            // 等待异步通知发送完成（通知在事务提交后异步执行）
            await new Promise(resolve => setTimeout(resolve, 50));

            // 验证站内通知服务被调用，且参数中包含正确的通知类型和内容
            expect(mocks.notificationServiceSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'admin-001',
                    type: 'SYSTEM',
                    title: expect.stringContaining('测试通知企业'),
                    link: '/admin/tenants',
                })
            );
        });
    });

    describe('getTenantApplicationStatus - 查询申请状态', () => {
        it('手机号不存在时应返回 found: false', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue(null);

            const { getTenantApplicationStatus } = await import('../actions/tenant-registration');
            const result = await getTenantApplicationStatus('19999999999');

            expect(result.found).toBe(false);
        });

        it('手机号存在时应返回申请状态', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({
                name: '测试企业',
                status: 'pending_approval',
                rejectReason: null,
            });

            const { getTenantApplicationStatus } = await import('../actions/tenant-registration');
            const result = await getTenantApplicationStatus('13800138000');

            expect(result.found).toBe(true);
            expect(result.status).toBe('pending_approval');
            expect(result.companyName).toBe('测试企业');
        });
    });

    // ═══════════════════════════════════════════
    //  L5 深度测试：认证审核
    // ═══════════════════════════════════════════

    describe('approveVerification - 通过企业认证', () => {
        it('认证状态非 pending 时应拒绝', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ verificationStatus: 'verified' });
            const { approveVerification } = await import('../actions/admin-actions');
            const result = await approveVerification(TENANT_ID);
            expect(result.success).toBe(false);
            expect(result.error).toContain('verified');
        });

        it('正常通过认证应返回成功', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ verificationStatus: 'pending' });
            const { approveVerification } = await import('../actions/admin-actions');
            const result = await approveVerification(TENANT_ID);
            expect(result.success).toBe(true);
        });

        it('认证通过后应记录审计日志', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ verificationStatus: 'pending' });
            const { approveVerification } = await import('../actions/admin-actions');
            await approveVerification(TENANT_ID);
            expect(mocks.auditRecord).toHaveBeenCalledWith(
                expect.anything(), // tx
                expect.objectContaining({
                    tableName: 'tenants',
                    action: 'UPDATE',
                    changedFields: expect.objectContaining({ verificationStatus: 'verified' }),
                }),
            );
        });
    });

    describe('rejectVerification - 驳回企业认证', () => {
        it('驳回原因为空时应返回错误', async () => {
            const { rejectVerification } = await import('../actions/admin-actions');
            const result = await rejectVerification(TENANT_ID, '');
            expect(result.success).toBe(false);
            expect(result.error).toContain('驳回原因');
        });

        it('正常驳回应返回成功', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ verificationStatus: 'pending' });
            const { rejectVerification } = await import('../actions/admin-actions');
            const result = await rejectVerification(TENANT_ID, '营业执照模糊');
            expect(result.success).toBe(true);
        });

        it('驳回后应记录审计日志', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ verificationStatus: 'pending' });
            const { rejectVerification } = await import('../actions/admin-actions');
            await rejectVerification(TENANT_ID, '材料不齐');
            expect(mocks.auditRecord).toHaveBeenCalled();
        });
    });

    // ═══════════════════════════════════════════
    //  L5 深度测试：AuditService 调用验证
    // ═══════════════════════════════════════════

    describe('AuditService 审计验证', () => {
        it('审批通过租户时应调用 AuditService.record', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ status: 'pending_approval', name: 'Test' });
            const { approveTenant } = await import('../actions/admin-actions');
            await approveTenant(TENANT_ID);
            expect(mocks.auditRecord).toHaveBeenCalledWith(
                expect.anything(), // tx
                expect.objectContaining({
                    tenantId: TENANT_ID,
                    userId: ADMIN_USER_ID,
                    tableName: 'tenants',
                    action: 'UPDATE',
                }),
            );
        });

        it('暂停租户时应调用 AuditService.record', async () => {
            const { suspendTenant } = await import('../actions/admin-actions');
            await suspendTenant(TENANT_ID, '违规');
            expect(mocks.auditRecord).toHaveBeenCalledWith(
                expect.anything(), // tx
                expect.objectContaining({
                    action: 'UPDATE',
                    changedFields: expect.objectContaining({ status: 'suspended' }),
                }),
            );
        });

        it('恢复租户时应调用 AuditService.record', async () => {
            mocks.dbQueryTenantsFindFirst.mockResolvedValue({ status: 'suspended' });
            const { activateTenant } = await import('../actions/admin-actions');
            await activateTenant(TENANT_ID);
            expect(mocks.auditRecord).toHaveBeenCalledWith(
                expect.anything(), // tx
                expect.objectContaining({
                    action: 'UPDATE',
                    changedFields: expect.objectContaining({ status: 'active' }),
                }),
            );
        });
    });
});

// ═══════════════════════════════════════════
//  platform-analytics.ts 独立测试套件
// ═══════════════════════════════════════════

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn: (...args: any[]) => any) => fn),
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('Platform Analytics - L5 统计测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue({ user: { id: 'admin-001' } });
        mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: true });
    });

    describe('getPlatformOverview', () => {
        it('未登录时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);

            const { getPlatformOverview } = await import('../actions/platform-analytics');
            const result = await getPlatformOverview();
            expect(result.success).toBe(false);
            expect(result.error).toContain('未登录');
        });

        it('非平台管理员应返回错误', async () => {
            mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: false });

            const { getPlatformOverview } = await import('../actions/platform-analytics');
            const result = await getPlatformOverview();
            expect(result.success).toBe(false);
            expect(result.error).toContain('权限');
        });

        it('平台管理员应返回统计数据', async () => {
            // mock db.select().from().groupBy()
            const { db } = await import('@/shared/api/db');
            (db as any).select = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    groupBy: vi.fn().mockResolvedValue([
                        { status: 'active', count: 10 },
                        { status: 'pending_approval', count: 3 },
                        { status: 'suspended', count: 1 },
                    ]),
                }),
            });

            const { getPlatformOverview } = await import('../actions/platform-analytics');
            const result = await getPlatformOverview();
            expect(result.success).toBe(true);
        });
    });

    describe('getRegistrationTrend', () => {
        it('非平台管理员应返回错误', async () => {
            mocks.dbQueryUsersFindFirst.mockResolvedValue({ isPlatformAdmin: false });

            const { getRegistrationTrend } = await import('../actions/platform-analytics');
            const result = await getRegistrationTrend();
            expect(result.success).toBe(false);
        });

        it('平台管理员应返回趋势数据', async () => {
            const { db } = await import('@/shared/api/db');
            (db as any).select = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        groupBy: vi.fn().mockReturnValue({
                            orderBy: vi.fn().mockResolvedValue([
                                { date: '2026-02-20', count: 5 },
                                { date: '2026-02-21', count: 3 },
                            ]),
                        }),
                    }),
                }),
            });

            const { getRegistrationTrend } = await import('../actions/platform-analytics');
            const result = await getRegistrationTrend();
            expect(result.success).toBe(true);
        });
    });

    describe('getRecentPlatformActivity', () => {
        it('平台管理员应返回近期活动', async () => {
            const { db } = await import('@/shared/api/db');
            (db as any).select = vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ count: 2 }]),
                }),
            });

            const { getRecentPlatformActivity } = await import('../actions/platform-analytics');
            const result = await getRecentPlatformActivity();
            expect(result.success).toBe(true);
        });
    });
});
