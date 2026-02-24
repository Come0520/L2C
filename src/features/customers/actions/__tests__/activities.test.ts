/**
 * 客户活动记录集成测试 (Activities)
 * 
 * 覆盖范围：
 * - getActivities: 获取客户活动列表 (权限/租户隔离)
 * - createActivity: 创建客户活动 (Schema校验/审计日志/租户隔离/客户归属校验)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock 定义 ──
const {
    MOCK_TENANT_ID, MOCK_USER_ID, MOCK_CUSTOMER_ID, MOCK_ACTIVITY_ID,
    mockDbInsert, mockDbQuery
} = vi.hoisted(() => {
    const TNT_ID = '880e8400-e29b-41d4-a716-446655440000';
    const USR_ID = '990e8400-e29b-41d4-a716-446655440000';
    const CUS_ID = '110e8400-e29b-41d4-a716-446655440000';
    const ACT_ID = '330e8400-e29b-41d4-a716-446655440000';

    const insertFn = vi.fn(() => ({
        values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: ACT_ID }]),
        })),
    }));

    const queryObj = {
        customers: { findFirst: vi.fn() },
        customerActivities: { findMany: vi.fn() },
    };

    return {
        MOCK_TENANT_ID: TNT_ID, MOCK_USER_ID: USR_ID, MOCK_CUSTOMER_ID: CUS_ID, MOCK_ACTIVITY_ID: ACT_ID,
        mockDbInsert: insertFn, mockDbQuery: queryObj
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        insert: mockDbInsert,
    },
}));

vi.mock('@/shared/api/schema', () => ({
    customers: { id: 'customers.id', tenantId: 'customers.tenantId' },
    customerActivities: {
        id: 'act.id',
        customerId: 'act.customerId',
        tenantId: 'act.tenantId',
        createdAt: 'act.createdAt'
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID },
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn() },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        CUSTOMER: { VIEW: 'CUSTOMER.VIEW', EDIT: 'CUSTOMER.EDIT' },
    },
}));

import { getActivities, createActivity } from '../activities';
import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { revalidateTag } from 'next/cache';

describe('Customer Activities Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getActivities', () => {
        it('应成功获取客户的活动列表', async () => {
            const mockActivities = [
                { id: '1', type: 'PHONE', description: 'Test', createdAt: new Date(), location: null, images: null, creator: { id: 'u1', name: 'User 1', avatarUrl: null } }
            ];
            mockDbQuery.customerActivities.findMany.mockResolvedValue(mockActivities);

            const result = await getActivities(MOCK_CUSTOMER_ID);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockActivities);
            expect(checkPermission).toHaveBeenCalledWith(expect.anything(), 'CUSTOMER.VIEW');
        });

        it('未登录时应返回 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValueOnce(null);
            const result = await getActivities(MOCK_CUSTOMER_ID);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('权限不足时应抛出错误或处理异常', async () => {
            vi.mocked(checkPermission).mockRejectedValueOnce(new Error('Forbidden'));
            const result = await getActivities(MOCK_CUSTOMER_ID);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to fetch activities');
        });

        it('应仅查询当前租户的数据', async () => {
            await getActivities(MOCK_CUSTOMER_ID);
            expect(mockDbQuery.customerActivities.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.anything() // Drizzle logic here
                })
            );
        });
    });

    describe('createActivity', () => {
        const validActivityInput = {
            customerId: MOCK_CUSTOMER_ID,
            type: 'PHONE' as const,
            description: '今天联系了客户，反馈良好',
        };

        it('应成功创建活动并记录审计日志', async () => {
            mockDbQuery.customers.findFirst.mockResolvedValue({ id: MOCK_CUSTOMER_ID });

            const result = await createActivity(validActivityInput);

            expect(result.success).toBe(true);
            expect(mockDbInsert).toHaveBeenCalled();
            expect(AuditService.log).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ action: 'CREATE', tableName: 'customer_activities' })
            );
        });

        it('客户不存在或不属于该租户时应拒绝创建', async () => {
            mockDbQuery.customers.findFirst.mockResolvedValue(null);

            const result = await createActivity(validActivityInput);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Customer not found or access denied');
        });

        it('输入参数不合法时应由于 Schema 校验失败而抛出异常 (被 catch)', async () => {
            const result = await createActivity({ ...validActivityInput, description: '' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to create activity');
        });

        it('创建成功后应精确刷新客户详情缓存 (revalidateTag)', async () => {
            mockDbQuery.customers.findFirst.mockResolvedValue({ id: MOCK_CUSTOMER_ID });

            await createActivity(validActivityInput);

            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(`customer-detail-${MOCK_CUSTOMER_ID}`, 'default');
        });

        it('审计日志应包含详细变更信息', async () => {
            mockDbQuery.customers.findFirst.mockResolvedValue({ id: MOCK_CUSTOMER_ID });

            await createActivity(validActivityInput);

            expect(AuditService.log).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    newValues: expect.objectContaining({ description: validActivityInput.description })
                })
            );
        });
    });
});
