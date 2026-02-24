'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库、鉴权、服务层
// ---------------------------------------------------------
const { mockQueryFindFirst, mockConvertFromQuote, mockAuditRecord, mockCheckAndGenerateCommission } = vi.hoisted(() => {
    return {
        mockQueryFindFirst: vi.fn(),
        mockConvertFromQuote: vi.fn(),
        mockAuditRecord: vi.fn().mockResolvedValue(undefined),
        mockCheckAndGenerateCommission: vi.fn().mockResolvedValue(undefined),
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quotes: { findFirst: mockQueryFindFirst },
        },
    }
}));

// Mock OrderService
vi.mock('@/services/order.service', () => ({
    OrderService: {
        convertFromQuote: mockConvertFromQuote,
    }
}));

// Mock AuditService
vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: mockAuditRecord,
    }
}));

// Mock 佣金逻辑
vi.mock('@/features/channels/logic/commission.service', () => ({
    checkAndGenerateCommission: mockCheckAndGenerateCommission,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/api/schema', () => ({
    orders: {},
}));

vi.mock('next/cache', () => ({
    revalidateTag: vi.fn(),
    revalidateTag: vi.fn()
}));

import { createOrderFromQuote } from '../creation';
import { auth } from '@/shared/lib/auth';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockQuoteId = '550e8400-e29b-41d4-a716-446655440001';
const mockOrderId = '660e8400-e29b-41d4-a716-446655440002';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
        roles: ['ADMIN'],
        role: 'MANAGER',
    }
};

describe('Order Creation Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-expect-error - 测试环境下简化 Session 类型
        vi.mocked(auth).mockResolvedValue(mockSession);
    });

    describe('createOrderFromQuote', () => {
        const validInput = {
            quoteId: mockQuoteId,
            paymentAmount: '1000.00',
        };

        it('成功从报价单创建订单', async () => {
            // 模拟报价单存在
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockQuoteId,
                tenantId: mockTenantId,
                totalAmount: '5000.00',
            });

            // 模拟 OrderService 返回创建的订单
            const mockOrder = { id: mockOrderId, orderNo: 'ORD-2026-001' };
            mockConvertFromQuote.mockResolvedValueOnce(mockOrder);

            const result = await createOrderFromQuote(validInput);

            expect(result).toEqual(mockOrder);
            expect(mockConvertFromQuote).toHaveBeenCalledWith(
                mockQuoteId,
                mockTenantId,
                '1000.00'
            );
            expect(mockAuditRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenantId: mockTenantId,
                    tableName: 'orders',
                    recordId: mockOrderId,
                    action: 'ORDER_CREATED',
                })
            );
            // 验证佣金异步处理被触发
            expect(mockCheckAndGenerateCommission).toHaveBeenCalledWith(
                mockOrderId,
                'ORDER_CREATED'
            );
        });

        it('报价单不存在时抛出异常', async () => {
            mockQueryFindFirst.mockResolvedValueOnce(null);

            await expect(createOrderFromQuote(validInput))
                .rejects.toThrow('Quote not found');
        });

        it('未登录时抛出异常', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            await expect(createOrderFromQuote(validInput))
                .rejects.toThrow('Unauthorized');
        });

        it('OrderService 异常时正确传播错误', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockQuoteId,
                tenantId: mockTenantId,
            });
            mockConvertFromQuote.mockRejectedValueOnce(new Error('转换失败'));

            await expect(createOrderFromQuote(validInput))
                .rejects.toThrow('转换失败');
        });
    });
});
