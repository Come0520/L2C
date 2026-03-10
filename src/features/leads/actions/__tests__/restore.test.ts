/**
 * Leads 模块 Server Actions 集成测试 (Restore)
 *
 * 覆盖范围：
 * - restoreLeadAction
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;
const MOCK_LEAD_ID = '550e8400-e29b-41d4-a716-446655440000';

vi.mock('@/shared/api/db', () => {
    const mockTx = {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    for: vi.fn().mockResolvedValue([{ id: MOCK_LEAD_ID, status: 'INVALID' }]) // Current lead lock
                }))
            }))
        })),
        query: {
            leadStatusHistory: {
                findFirst: vi.fn().mockResolvedValue({ oldStatus: 'FOLLOWING_UP' })
            }
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([{ id: MOCK_LEAD_ID }])
            }))
        })),
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue([{ id: 'mock-insert-history-id' }])
        }))
    };

    return {
        db: {
            query: {
                leads: {
                    findFirst: vi.fn().mockResolvedValue({ id: MOCK_LEAD_ID, status: 'INVALID' }), // 1st step: can access
                },
                approvalFlows: {
                    findFirst: vi.fn().mockResolvedValue(null), // No approval needed
                }
            },
            transaction: vi.fn((cb) => cb(mockTx)),
            _mockTx: mockTx // Expose for assertions
        }
    };
});

vi.mock('@/shared/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    updateTag: vi.fn()
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(true)
    }
}));

describe('Lead Restore Action', () => {
    let dbMock: any;
    let authMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { db } = await import('@/shared/api/db');
        const { auth } = await import('@/shared/lib/auth');
        dbMock = db;
        authMock = auth;
        vi.mocked(authMock).mockResolvedValue(MOCK_SESSION);
    });

    it('restoreLeadAction 应该在事务更新时包含 tenantId 过滤 (D3-001)', async () => {
        const { restoreLeadAction } = await import('../restore');

        // 执行恢复行动
        const result = await restoreLeadAction({ id: MOCK_LEAD_ID, reason: 'Test Reason' });

        // 验证执行成功
        expect(result.success).toBe(true);

        // 取得事物内 update(...).set(...).where 的调用参数
        const txUpdateWhereCall = dbMock._mockTx.update().set().where.mock.calls[0][0];

        // 断言该 where 条件中包含了 AND，且租户 ID 等于当前会话的 tenantId
        // Drizzle 的 eq 和 and 返回的 AST 对象不易直接等价匹配，我们可以将其转为 SQL 进行比对或检查它的 structure
        const { buildDataScopeFilter } = await import('@/shared/lib/data-scope-filter');

        // 我们检查 `where` 是否是一个 and 条件对象
        const isAndNode = txUpdateWhereCall?.constructor?.name === 'SQL'
            || txUpdateWhereCall?.config?.operator === 'and';

        // 为确保测试能捕捉到单纯的只用 leads.id 过滤的 Bug，如果没用 And 并过滤 tenantId，我们将测试失败。
        // 在 Drizzle AST 中一个常见的判别特征：
        // 未修复前：txUpdateWhereCall 会是 eq(leads.id, id)
        // 修复后：txUpdateWhereCall 会是 and(eq(leads.id, id), eq(leads.tenantId, tenantId))

        // 我们直接将它序列化观察，如果包含了 'tenantId' 即视为过滤了该字段
        const conditionStr = JSON.stringify(txUpdateWhereCall || {});
        expect(conditionStr).toContain('tenantId');
    });
});
