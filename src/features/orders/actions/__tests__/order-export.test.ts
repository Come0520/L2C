'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库、鉴权
// ---------------------------------------------------------
const { mockQueryFindMany } = vi.hoisted(() => {
    return {
        mockQueryFindMany: vi.fn(),
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: { findMany: mockQueryFindMany },
        },
    }
}));

vi.mock('@/shared/api/schema', () => ({
    orders: {
        tenantId: 'orders.tenantId',
        createdAt: 'orders.createdAt',
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        ORDER: {
            VIEW: 'order:view',
        }
    }
}));

// Mock date-fns format
vi.mock('date-fns', () => ({
    format: vi.fn((date: Date, pattern: string) => {
        if (pattern === 'yyyy-MM-dd HH:mm') return '2026-01-15 10:30';
        if (pattern === 'yyyyMMdd') return '20260115';
        return date.toISOString();
    }),
}));

import { exportOrdersAction } from '../order-export';
import { auth } from '@/shared/lib/auth';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
        roles: ['ADMIN'],
        role: 'MANAGER',
    }
};

describe('Order Export Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-expect-error - 测试环境下简化 Session 类型
        vi.mocked(auth).mockResolvedValue(mockSession);
    });

    describe('exportOrdersAction', () => {
        it('成功导出订单为 CSV', async () => {
            mockQueryFindMany.mockResolvedValueOnce([
                {
                    orderNo: 'ORD-001',
                    customer: { name: '张三' },
                    totalAmount: '5000.00',
                    status: 'PAID',
                    createdAt: new Date('2026-01-15T10:30:00Z'),
                },
                {
                    orderNo: 'ORD-002',
                    customer: { name: '李四' },
                    totalAmount: '3000.00',
                    status: 'IN_PRODUCTION',
                    createdAt: new Date('2026-01-14T08:00:00Z'),
                },
            ]);

            const result = await exportOrdersAction({});

            expect(result.success).toBe(true);
            expect(result.data).toContain('订单号,客户,金额,状态,创建时间');
            expect(result.data).toContain('ORD-001');
            expect(result.data).toContain('张三');
            expect(result.filename).toMatch(/^orders_export_\d{8}\.csv$/);
        });

        it('空数据时返回仅含标题行的 CSV', async () => {
            mockQueryFindMany.mockResolvedValueOnce([]);

            const result = await exportOrdersAction({});

            expect(result.success).toBe(true);
            expect(result.data).toBe('订单号,客户,金额,状态,创建时间');
        });

        it('未登录时返回错误', async () => {
            // @ts-expect-error - 模拟未登录状态
            vi.mocked(auth).mockResolvedValueOnce(null);

            const result = await exportOrdersAction({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('数据库异常时返回错误', async () => {
            mockQueryFindMany.mockRejectedValueOnce(new Error('DB connection lost'));

            const result = await exportOrdersAction({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB connection lost');
        });
    });
});
