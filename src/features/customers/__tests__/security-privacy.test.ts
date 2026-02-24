/**
 * 客户模块安全性与隐私测试
 * 
 * 覆盖范围：
 * - 未授权访问拒绝（queries）
 * - 权限检查拦截
 * - 隐私操作 (logPhoneView/getPhoneViewLogs) 安全验证
 * - 活动操作安全与边界测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock 定义 ──

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    // unstable_cache：直接执行传入的函数，不做缓存
    unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
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
        INVALID_OPERATION: 'INVALID_OPERATION',
    },
}));

vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: vi.fn((schema: unknown, fn: (...args: unknown[]) => unknown) => fn),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        CUSTOMER: { LIST: 'CUSTOMER.LIST', VIEW: 'CUSTOMER.VIEW', CREATE: 'CUSTOMER.CREATE', EDIT: 'CUSTOMER.EDIT', DELETE: 'CUSTOMER.DELETE' },
    },
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            customers: { findFirst: vi.fn(), findMany: vi.fn() },
            customerActivities: { findMany: vi.fn() },
            phoneViewLogs: { findMany: vi.fn() },
        },
        $count: vi.fn(),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-1' }])
            })
        }),
        update: vi.fn(),
        delete: vi.fn(),
        transaction: vi.fn(),
    }
}));

vi.mock('@/shared/api/schema/customers', () => ({
    customers: { id: 'c.id', tenantId: 'c.tenantId', name: 'c.name', phone: 'c.phone', createdAt: 'c.createdAt' },
    customerActivities: { id: 'ca.id', customerId: 'ca.customerId', tenantId: 'ca.tenantId', createdAt: 'ca.createdAt' },
    phoneViewLogs: { id: 'pvl.id', tenantId: 'pvl.tenantId', customerId: 'pvl.customerId', createdAt: 'pvl.createdAt' },
}));

vi.mock('@/shared/api/schema', () => ({
    customers: { id: 'c.id', tenantId: 'c.tenantId', name: 'c.name' },
    customerActivities: { id: 'ca.id', customerId: 'ca.customerId', tenantId: 'ca.tenantId', createdAt: 'ca.createdAt' },
    orders: { customerId: 'o.customerId', tenantId: 'o.tenantId' },
    leads: { customerId: 'l.customerId', tenantId: 'l.tenantId' },
    users: {},
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(true) },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/shared/lib/utils', () => ({
    trimInput: vi.fn((v: unknown) => v),
}));

import { auth, checkPermission } from '@/shared/lib/auth';

describe('Customers Security (客户模块安全测试)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── 未授权测试 ──
    describe('未授权访问拒绝', () => {
        it('getCustomers：未登录应抛出 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { getCustomers } = await import('../actions/queries');
            await expect(getCustomers({})).rejects.toThrow();
        });

        it('getCustomerDetail：未登录应抛出错误', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { getCustomerDetail } = await import('../actions/queries');
            await expect(getCustomerDetail('c1')).rejects.toThrow();
        });
    });

    // ── 权限检查 ──
    describe('权限检查拦截', () => {
        it('getCustomers：权限拒绝应抛出异常', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'u1', tenantId: 'tenant-1' }
            } as unknown as Awaited<ReturnType<typeof auth>>);
            vi.mocked(checkPermission).mockRejectedValue(new Error('Permission denied'));

            const { getCustomers } = await import('../actions/queries');
            await expect(getCustomers({})).rejects.toThrow('Permission denied');
        });
    });

    // ── 隐私操作安全测试 ──
    describe('隐私操作安全', () => {
        it('logPhoneView：未登录应抛出 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { logPhoneView } = await import('../actions/privacy-actions');
            await expect(logPhoneView({ customerId: 'c1' })).rejects.toThrow('Unauthorized');
        });

        it('getPhoneViewLogs：未登录应抛出 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { getPhoneViewLogs } = await import('../actions/privacy-actions');
            await expect(getPhoneViewLogs('c1')).rejects.toThrow('Unauthorized');
        });
    });

    // ── 活动操作安全 ──
    describe('活动操作安全', () => {
        it('getActivities：未登录应返回 success: false', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { getActivities } = await import('../actions/activities');
            const result = await getActivities('c1');
            expect(result).toMatchObject({ success: false });
        });

        it('createActivity：未登录应返回 success: false', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { createActivity } = await import('../actions/activities');
            const result = await createActivity({
                customerId: 'c1',
                type: 'VISIT',
                description: '测试拜访',
            });
            expect(result).toMatchObject({ success: false });
        });
    });
});
