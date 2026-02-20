'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库、鉴权、服务层
// ---------------------------------------------------------
const {
    mockUpdate,
    mockQueryFindFirst,
    mockConfirmInstallation,
    mockCustomerAccept,
    mockRequestCustomerConfirmation,
    mockCustomerReject,
    mockAuditRecord
} = vi.hoisted(() => {
    const fnUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined)
        })
    });
    return {
        mockUpdate: fnUpdate,
        mockQueryFindFirst: vi.fn(),
        mockConfirmInstallation: vi.fn().mockResolvedValue(undefined),
        mockCustomerAccept: vi.fn().mockResolvedValue(undefined),
        mockRequestCustomerConfirmation: vi.fn().mockResolvedValue(undefined),
        mockCustomerReject: vi.fn().mockResolvedValue(undefined),
        mockAuditRecord: vi.fn().mockResolvedValue(undefined),
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: { findFirst: mockQueryFindFirst, findMany: vi.fn() },
        },
        update: mockUpdate,
    }
}));

vi.mock('@/shared/api/schema/orders', () => ({
    orders: {
        id: 'orders.id',
        tenantId: 'orders.tenantId',
        status: 'orders.status',
        updatedAt: 'orders.updatedAt',
    },
    orderChanges: {
        id: 'orderChanges.id',
    }
}));

vi.mock('@/shared/api/schema', () => ({
    orders: {
        id: 'orders.id',
        tenantId: 'orders.tenantId',
        status: 'orders.status',
    },
}));

// Mock OrderService
vi.mock('@/services/order.service', () => ({
    OrderService: {
        confirmInstallation: mockConfirmInstallation,
        customerAccept: mockCustomerAccept,
        requestCustomerConfirmation: mockRequestCustomerConfirmation,
        customerReject: mockCustomerReject,
    }
}));

// Mock AuditService
vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: mockAuditRecord,
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        ORDER: {
            VIEW: 'order:view',
            EDIT: 'order:edit',
            MANAGE: 'order:manage',
        }
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

import {
    cancelOrderAction,
    confirmInstallationAction,
    customerAcceptAction,
    closeOrderAction,
    requestCustomerConfirmationAction,
    customerRejectAction,
} from '../orders';
import { auth, checkPermission } from '@/shared/lib/auth';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockOrderId = '550e8400-e29b-41d4-a716-446655440001';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
        roles: ['ADMIN'],
        role: 'MANAGER',
    }
};

describe('Orders Lifecycle Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-expect-error - 测试环境下简化 Session 类型
        vi.mocked(auth).mockResolvedValue(mockSession);
        vi.mocked(checkPermission).mockResolvedValue(undefined);
    });

    // =========================================================
    // cancelOrderAction
    // =========================================================
    describe('cancelOrderAction', () => {
        it('成功取消订单', async () => {
            const result = await cancelOrderAction({
                orderId: mockOrderId,
                reason: '客户要求取消',
            });

            expect(result).toEqual({ success: true });
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockAuditRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'ORDER_CANCELLED',
                    recordId: mockOrderId,
                })
            );
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(
                cancelOrderAction({ orderId: mockOrderId, reason: '测试' })
            ).rejects.toThrow();
        });
    });

    // =========================================================
    // confirmInstallationAction
    // =========================================================
    describe('confirmInstallationAction', () => {
        it('成功确认安装完成', async () => {
            const result = await confirmInstallationAction(mockOrderId);

            expect(result).toEqual({ success: true });
            expect(mockConfirmInstallation).toHaveBeenCalledWith(
                mockOrderId,
                mockTenantId,
                'u-001'
            );
            expect(mockAuditRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'ORDER_INSTALLED',
                })
            );
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(confirmInstallationAction(mockOrderId))
                .rejects.toThrow();
        });

        it('Service 异常时正确传播', async () => {
            mockConfirmInstallation.mockRejectedValueOnce(new Error('安装确认失败'));

            await expect(confirmInstallationAction(mockOrderId))
                .rejects.toThrow('安装确认失败');
        });
    });

    // =========================================================
    // customerAcceptAction
    // =========================================================
    describe('customerAcceptAction', () => {
        it('成功验收通过', async () => {
            const result = await customerAcceptAction(mockOrderId);

            expect(result).toEqual({ success: true });
            expect(mockCustomerAccept).toHaveBeenCalledWith(
                mockOrderId,
                mockTenantId
            );
            expect(mockAuditRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'ORDER_CUSTOMER_ACCEPTED',
                })
            );
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(customerAcceptAction(mockOrderId))
                .rejects.toThrow();
        });
    });

    // =========================================================
    // closeOrderAction
    // =========================================================
    describe('closeOrderAction', () => {
        it('成功关闭订单', async () => {
            const result = await closeOrderAction(mockOrderId);

            expect(result).toEqual({ success: true });
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockAuditRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'ORDER_CLOSED',
                })
            );
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(closeOrderAction(mockOrderId))
                .rejects.toThrow();
        });
    });

    // =========================================================
    // requestCustomerConfirmationAction
    // =========================================================
    describe('requestCustomerConfirmationAction', () => {
        it('成功请求客户确认', async () => {
            const result = await requestCustomerConfirmationAction({
                orderId: mockOrderId,
            });

            expect(result).toEqual({ success: true });
            expect(mockRequestCustomerConfirmation).toHaveBeenCalledWith(
                mockOrderId,
                mockTenantId,
                'u-001'
            );
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(
                requestCustomerConfirmationAction({ orderId: mockOrderId })
            ).rejects.toThrow();
        });
    });

    // =========================================================
    // customerRejectAction
    // =========================================================
    describe('customerRejectAction', () => {
        it('成功处理客户拒绝', async () => {
            const result = await customerRejectAction({
                orderId: mockOrderId,
                reason: '颜色不对',
            });

            expect(result).toEqual({ success: true });
            expect(mockCustomerReject).toHaveBeenCalledWith(
                mockOrderId,
                mockTenantId,
                '颜色不对'
            );
            expect(mockAuditRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'ORDER_CUSTOMER_REJECTED',
                })
            );
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(
                customerRejectAction({ orderId: mockOrderId, reason: '测试' })
            ).rejects.toThrow();
        });
    });
});
