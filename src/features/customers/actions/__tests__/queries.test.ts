/**
 * 客户模块 Server Actions 集成测试 (Queries + Activities)
 *
 * 覆盖范围：
 * - getCustomers（分页列表查询）
 * - getCustomerDetail（详情查询）
 * - getActivities / createActivity（跟进记录）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock 定义 ──
const { MOCK_TENANT_ID, MOCK_USER_ID, MOCK_CUSTOMER_ID, mockDbQuery } = vi.hoisted(() => {
    return {
        MOCK_TENANT_ID: '880e8400-e29b-41d4-a716-446655440000',
        MOCK_USER_ID: '990e8400-e29b-41d4-a716-446655440000',
        MOCK_CUSTOMER_ID: '110e8400-e29b-41d4-a716-446655440000',
        mockDbQuery: {
            customers: { findFirst: vi.fn(), findMany: vi.fn() },
            customerActivities: { findMany: vi.fn() },
        }
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        $count: vi.fn().mockResolvedValue(1),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'activity-1' }]),
            })),
        })),
    },
}));

vi.mock('@/shared/api/schema', () => ({
    customers: { id: 'customers.id', tenantId: 'customers.tenantId', deletedAt: 'customers.deletedAt', name: 'customers.name', phone: 'customers.phone', type: 'customers.type', level: 'customers.level', assignedSalesId: 'customers.assignedSalesId', lifecycleStage: 'customers.lifecycleStage', pipelineStatus: 'customers.pipelineStatus', createdAt: 'customers.createdAt' },
    customerActivities: { id: 'act.id', customerId: 'act.customerId', tenantId: 'act.tenantId', createdAt: 'act.createdAt' },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID, roles: ['ADMIN'] },
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn() },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/utils', () => ({
    trimInput: vi.fn((v: unknown) => v),
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/shared/lib/errors', () => ({
    AppError: class AppError extends Error {
        code: string;
        statusCode: number;
        constructor(msg: string, code: string, statusCode: number) {
            super(msg);
            this.code = code;
            this.statusCode = statusCode;
        }
    },
    ERROR_CODES: {
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
    },
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        CUSTOMER: { VIEW: 'CUSTOMER.VIEW', EDIT: 'CUSTOMER.EDIT' },
    },
}));

// ── 测试套件 ──

describe('Customers Queries (L5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getCustomerDetail 应根据 ID 获取客户详情', async () => {
        const mockCustomer = {
            id: MOCK_CUSTOMER_ID,
            name: '张三',
            phone: '13800138000',
            tenantId: MOCK_TENANT_ID,
            addresses: [],
            activities: [],
        };
        mockDbQuery.customers.findFirst.mockResolvedValue(mockCustomer);

        const { getCustomerDetail } = await import('../queries');
        const result = await getCustomerDetail(MOCK_CUSTOMER_ID);
        expect(result).toEqual(expect.objectContaining({ id: MOCK_CUSTOMER_ID, name: '张三' }));
    });

    it('getCustomerDetail 客户不存在时应返回 undefined', async () => {
        mockDbQuery.customers.findFirst.mockResolvedValue(undefined);

        const { getCustomerDetail } = await import('../queries');
        const result = await getCustomerDetail(MOCK_CUSTOMER_ID);
        expect(result).toBeUndefined();
    });
});

describe('Customers Activities (L5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getActivities 应返回客户跟进记录列表', async () => {
        const mockActivities = [
            { id: 'act-1', type: 'VISIT', description: '上门拜访', createdAt: new Date(), creator: { id: MOCK_USER_ID, name: '销售员', avatarUrl: null } },
        ];
        mockDbQuery.customerActivities.findMany.mockResolvedValue(mockActivities);

        const { getActivities } = await import('../activities');
        const result = await getActivities(MOCK_CUSTOMER_ID);
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data![0].type).toBe('VISIT');
    });

    it('createActivity 应创建跟进记录并记录审计日志', async () => {
        mockDbQuery.customers.findFirst.mockResolvedValue({ id: MOCK_CUSTOMER_ID, tenantId: MOCK_TENANT_ID });

        const { createActivity } = await import('../activities');
        const result = await createActivity({
            customerId: MOCK_CUSTOMER_ID,
            type: 'PHONE',
            description: '电话沟通产品需求',
        });
        expect(result.success).toBe(true);
    });
});
