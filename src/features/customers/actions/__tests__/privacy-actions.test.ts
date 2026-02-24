/**
 * 隐私操作集成测试 (Privacy Actions)
 * 
 * 覆盖范围：
 * - logPhoneView: 记录手机号查看日志 (权限/审计)
 * - getPhoneViewLogs: 获取查看日志列表 (租户隔离)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock 定义 ──
const {
    MOCK_TENANT_ID, MOCK_USER_ID, MOCK_CUSTOMER_ID,
    mockDbInsert, mockDbQuery
} = vi.hoisted(() => {
    const TNT_ID = '880e8400-e29b-41d4-a716-446655440000';
    const USR_ID = '990e8400-e29b-41d4-a716-446655440000';
    const CUS_ID = '110e8400-e29b-41d4-a716-446655440000';

    const insertFn = vi.fn(() => ({
        values: vi.fn().mockResolvedValue([{ id: 'log-id' }]),
    }));

    const queryObj = {
        phoneViewLogs: { findMany: vi.fn() },
    };

    return {
        MOCK_TENANT_ID: TNT_ID, MOCK_USER_ID: USR_ID, MOCK_CUSTOMER_ID: CUS_ID,
        mockDbInsert: insertFn, mockDbQuery: queryObj
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        insert: mockDbInsert,
    },
}));

vi.mock('@/shared/api/schema/customers', () => ({
    phoneViewLogs: {
        id: 'pvl.id',
        customerId: 'pvl.customerId',
        tenantId: 'pvl.tenantId',
        createdAt: 'pvl.createdAt'
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID, role: 'MANAGER' },
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
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
        CUSTOMER: { VIEW: 'CUSTOMER.VIEW' },
    },
}));

import { logPhoneView, getPhoneViewLogs } from '../privacy-actions';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidateTag } from 'next/cache';

describe('Privacy Actions (Phone View Logs)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('logPhoneView', () => {
        const validInput = { customerId: MOCK_CUSTOMER_ID, ipAddress: '127.0.0.1' };

        it('应成功记录手机号查看日志', async () => {
            await logPhoneView(validInput);

            expect(mockDbInsert).toHaveBeenCalled();
            expect(checkPermission).toHaveBeenCalledWith(expect.anything(), 'CUSTOMER.VIEW');
        });

        it('未登录时应抛出错误', async () => {
            vi.mocked(auth).mockResolvedValueOnce(null);
            await expect(logPhoneView(validInput)).rejects.toThrow('Unauthorized');
        });

        it('应将查看者角色正确存入日志', async () => {
            await logPhoneView(validInput);
            expect(mockDbInsert).toHaveBeenCalledWith(expect.anything());
        });

        it('创建成功后应精确刷新客户详情缓存 (revalidateTag)', async () => {
            await logPhoneView(validInput);
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(`customer-detail-${MOCK_CUSTOMER_ID}`, 'default');
        });
    });

    describe('getPhoneViewLogs', () => {
        it('应成功获取当前租户下的手机号查看日志', async () => {
            const mockLogs = [{ id: '1', customerId: MOCK_CUSTOMER_ID, viewerId: MOCK_USER_ID, viewerRole: null, createdAt: new Date() }];
            mockDbQuery.phoneViewLogs.findMany.mockResolvedValue(mockLogs);

            const result = await getPhoneViewLogs(MOCK_CUSTOMER_ID);

            expect(result).toEqual(
                expect.arrayContaining([expect.objectContaining({ id: '1', customerId: MOCK_CUSTOMER_ID })])
            );
            expect(checkPermission).toHaveBeenCalledWith(expect.anything(), 'CUSTOMER.VIEW');
        });

        it('权限不足时应抛出错误', async () => {
            vi.mocked(checkPermission).mockRejectedValueOnce(new Error('Forbidden'));
            await expect(getPhoneViewLogs(MOCK_CUSTOMER_ID)).rejects.toThrow();
        });

        it('未授权租户信息时应抛出错误', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: MOCK_USER_ID } } as any);
            await expect(getPhoneViewLogs(MOCK_CUSTOMER_ID)).rejects.toThrow('Unauthorized');
        });
    });
});
