import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateOrderCommission, handleCommissionClawback, checkAndGenerateCommission } from '../commission.service';
import { Decimal } from 'decimal.js';

// 1. 使用 vi.hoisted 显式提升 Mock 变量
const mocks = vi.hoisted(() => ({
    queryFindFirst: vi.fn(),
    queryFindMany: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(() => ({ returning: vi.fn() })),
    set: vi.fn(() => ({ where: vi.fn() })),
    updateChain: vi.fn(() => ({ set: vi.fn() })),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            financeConfigs: { findFirst: mocks.queryFindFirst },
            products: { findMany: mocks.queryFindMany },
            orders: { findFirst: mocks.queryFindFirst },
            leads: { findFirst: mocks.queryFindFirst },
            channels: { findFirst: mocks.queryFindFirst },
            channelCommissions: { findFirst: mocks.queryFindFirst, findMany: mocks.queryFindMany },
        },
        transaction: vi.fn(async (cb) => {
            const tx = {
                query: {
                    channelCommissions: { findFirst: mocks.queryFindFirst },
                },
                insert: (table: any) => ({ values: (vals: any) => mocks.insert(vals) }),
                update: (table: any) => ({
                    set: (vals: any) => {
                        const setObj = mocks.set(vals);
                        return { where: (cond: any) => mocks.update(cond) };
                    }
                }),
            };
            await cb(tx);
        }),
        update: (table: any) => ({
            set: (vals: any) => {
                const setObj = mocks.set(vals);
                return { where: (cond: any) => mocks.update(cond) };
            }
        }),
    }
}));

describe('Commission Service Logic - calculateOrderCommission', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate fixed commission correctly (integer percentage)', async () => {
        const order = { totalAmount: '10000', items: [], tenantId: 't1' };
        const channel = { cooperationMode: 'COMMISSION', commissionType: 'FIXED', commissionRate: 15 };

        const result = await calculateOrderCommission(order, channel);

        expect(result).toBeDefined();
        expect(result!.amount.toNumber()).toBe(1500);
        expect(result!.type).toBe('COMMISSION');
    });

    it('should calculate base price commission correctly', async () => {
        mocks.queryFindFirst.mockResolvedValueOnce({
            configValue: JSON.stringify({ S: 0.8, A: 0.9, B: 1.0, C: 1.0 })
        });

        mocks.queryFindMany.mockResolvedValueOnce([
            { id: 'p1', channelPrice: '500', name: 'Product 1' }
        ]);

        const order = {
            totalAmount: '2000',
            items: [{ productId: 'p1', unitPrice: '1000', quantity: 2 }],
            tenantId: 't1',
            channelCooperationMode: 'BASE_PRICE'
        };
        const channel = { level: 'S' };

        const result = await calculateOrderCommission(order, channel);

        expect(result).toBeDefined();
        expect(result!.amount.toNumber()).toBe(1200);
    });
});
describe('Commission Service Logic - calculateOrderCommission Advanced', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate tiered rates correctly', async () => {
        const order = { totalAmount: '20000', items: [], tenantId: 't1' };
        const channel = {
            cooperationMode: 'COMMISSION',
            commissionType: 'TIERED',
            tieredRates: JSON.stringify([
                { minAmount: 0, maxAmount: 10000, rate: 10 },
                { minAmount: 10000, maxAmount: 30000, rate: 20 }
            ])
        };

        const result = await calculateOrderCommission(order, channel);

        expect(result).toBeDefined();
        expect(result!.amount.toNumber()).toBe(4000); // 20000 * 20%
    });

    it('should fallback to base rate if tiered rates are invalid', async () => {
        const order = { totalAmount: '5000', items: [], tenantId: 't1' };
        const channel = {
            cooperationMode: 'COMMISSION',
            commissionType: 'TIERED',
            tieredRates: 'invalid-json',
            commissionRate: 5
        };

        const result = await calculateOrderCommission(order, channel);

        expect(result).toBeDefined();
        expect(result!.amount.toNumber()).toBe(250); // 5000 * 5%
    });
});

describe('Commission Service - checkAndGenerateCommission', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should trigger and insert commission if event matches', async () => {
        mocks.queryFindFirst.mockResolvedValueOnce({ id: 'order-1', channelId: 'c1', totalAmount: '1000', tenantId: 't1', createdBy: 'u1' }); // orders
        mocks.queryFindFirst.mockResolvedValueOnce({ id: 'c1', tenantId: 't1', commissionTriggerMode: 'ORDER_CREATED', commissionType: 'FIXED', commissionRate: 10 }); // channels
        mocks.queryFindFirst.mockResolvedValueOnce(null); // existing record check

        await checkAndGenerateCommission('order-1', 'ORDER_CREATED');

        expect(mocks.insert).toHaveBeenCalled();
    });

    it('should ignore if event mismatch', async () => {
        mocks.queryFindFirst.mockResolvedValueOnce({ id: 'order-1', channelId: 'c1', totalAmount: '1000', tenantId: 't1' });
        mocks.queryFindFirst.mockResolvedValueOnce({ id: 'c1', tenantId: 't1', commissionTriggerMode: 'PAYMENT_COMPLETED' });

        await checkAndGenerateCommission('order-1', 'ORDER_CREATED');

        expect(mocks.insert).not.toHaveBeenCalled();
    });
});

describe('Commission Service - Clawback Advanced', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate adjustment for SETTLED commissions', async () => {
        mocks.queryFindFirst.mockResolvedValueOnce({ tenantId: 't1' });
        mocks.queryFindMany.mockResolvedValueOnce([{
            id: 'comm1', tenantId: 't1', status: 'SETTLED', amount: '1000', orderAmount: '10000', channelId: 'c1'
        }]);

        await handleCommissionClawback('order-1', 5000); // 50% refund

        expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
            adjustmentAmount: '-500.00'
        }));
    });
});
