'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库、鉴权、服务层
// ---------------------------------------------------------
const { mockUpdate, mockQueryFindFirst, mockAuditRecord, mockExecuteSplitRouting } = vi.hoisted(() => {
    const fnUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined)
        })
    });
    return {
        mockUpdate: fnUpdate,
        mockQueryFindFirst: vi.fn(),
        mockAuditRecord: vi.fn().mockResolvedValue(undefined),
        mockExecuteSplitRouting: vi.fn().mockResolvedValue({ splitCount: 2 }),
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: { findFirst: mockQueryFindFirst },
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
        settlementType: 'orders.settlementType',
    }
}));

// Mock AuditService
vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: mockAuditRecord,
    }
}));

// Mock executeSplitRouting
vi.mock('@/features/supply-chain/actions/split-engine', () => ({
    executeSplitRouting: mockExecuteSplitRouting,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        ORDER: {
            MANAGE: 'order:manage',
        }
    }
}));

import { confirmOrderProduction, splitOrder } from '../production';
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

describe('Order Production Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-expect-error - 测试环境下简化 Session 类型
        vi.mocked(auth).mockResolvedValue(mockSession);
        vi.mocked(checkPermission).mockResolvedValue(undefined);
    });

    describe('confirmOrderProduction', () => {
        it('PAID 状态订单成功开始生产', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockOrderId,
                tenantId: mockTenantId,
                status: 'PAID',
                settlementType: 'FULL',
            });

            const result = await confirmOrderProduction({
                orderId: mockOrderId,
                remark: '开始生产',
            });

            expect(result).toEqual({ success: true });
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockAuditRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'ORDER_PRODUCTION_STARTED',
                    newValues: expect.objectContaining({ status: 'IN_PRODUCTION' }),
                })
            );
            // 验证自动拆单被触发
            expect(mockExecuteSplitRouting).toHaveBeenCalledWith(
                mockOrderId,
                mockTenantId,
                mockSession
            );
        });

        it('MONTHLY 结算订单无需全额付款即可开始生产', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockOrderId,
                tenantId: mockTenantId,
                status: 'SIGNED', // 未付款
                settlementType: 'MONTHLY',
            });

            const result = await confirmOrderProduction({
                orderId: mockOrderId,
            });

            expect(result).toEqual({ success: true });
        });

        it('非 PAID 且非 MONTHLY 状态不允许开始生产', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockOrderId,
                tenantId: mockTenantId,
                status: 'SIGNED',
                settlementType: 'FULL',
            });

            await expect(confirmOrderProduction({ orderId: mockOrderId }))
                .rejects.toThrow('Order must be PAID to start production');
        });

        it('订单不存在时抛出异常', async () => {
            mockQueryFindFirst.mockResolvedValueOnce(null);

            await expect(confirmOrderProduction({ orderId: mockOrderId }))
                .rejects.toThrow('Order not found');
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(confirmOrderProduction({ orderId: mockOrderId }))
                .rejects.toThrow('Unauthorized');
        });
    });

    describe('splitOrder', () => {
        const validInput = {
            orderId: mockOrderId,
            items: [
                {
                    itemId: '110e8400-e29b-41d4-a716-446655440010',
                    quantity: '5',
                    supplierId: '220e8400-e29b-41d4-a716-446655440020',
                },
            ],
        };

        it('成功执行拆单', async () => {
            const result = await splitOrder(validInput);

            expect(result).toEqual({ success: true, data: { splitCount: 2 } });
            expect(mockExecuteSplitRouting).toHaveBeenCalledWith(
                mockOrderId,
                mockTenantId,
                mockSession
            );
            expect(mockAuditRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'ORDER_SPLIT_MANUAL',
                })
            );
        });

        it('拆单引擎异常时正确传播', async () => {
            mockExecuteSplitRouting.mockRejectedValueOnce(new Error('库存不足'));

            await expect(splitOrder(validInput))
                .rejects.toThrow('库存不足');
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(splitOrder(validInput))
                .rejects.toThrow('Unauthorized');
        });
    });
});
