import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateOrderCommission, handleCommissionClawback, checkAndGenerateCommission } from '../commission.service';
import { Decimal } from 'decimal.js';

// Mock DB interactions
const mockQueryFindFirst = vi.fn();
const mockQueryFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn(() => ({ returning: vi.fn() }));
const mockSet = vi.fn(() => ({ where: mockUpdate }));
const mockUpdateChain = vi.fn(() => ({ set: mockSet }));
const mockDelete = vi.fn();

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            financeConfigs: { findFirst: (...args: any[]) => mockQueryFindFirst(...args) },
            products: { findMany: (...args: any[]) => mockQueryFindMany(...args) },
            orders: { findFirst: (...args: any[]) => mockQueryFindFirst(...args) },
            leads: { findFirst: (...args: any[]) => mockQueryFindFirst(...args) },
            channels: { findFirst: (...args: any[]) => mockQueryFindFirst(...args) },
            channelCommissions: { findFirst: (...args: any[]) => mockQueryFindFirst(...args), findMany: (...args: any[]) => mockQueryFindMany(...args) },
        },
        update: (...args: any[]) => mockUpdateChain(...args),
        insert: (...args: any[]) => mockInsert(...args),
        transaction: vi.fn(async (cb) => {
            await cb({
                query: {
                    channelCommissions: { findFirst: mockQueryFindFirst },
                },
                insert: (...args: any[]) => ({ values: mockInsert }), // simplified mock chain for tx.insert
                update: (...args: any[]) => ({ set: mockSet }),
            });
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
        expect(result!.rate.toNumber()).toBe(0.15); // Rate correctly transformed to 0.15 from 15%
        expect(result!.type).toBe('COMMISSION');
    });

    it('should calculate fixed commission correctly (decimal representation)', async () => {
        const order = { totalAmount: '10000', items: [], tenantId: 't1' };
        // Passing 0.15 instead of 15% directly
        const channel = { cooperationMode: 'COMMISSION', commissionType: 'FIXED', commissionRate: 0.15 };

        const result = await calculateOrderCommission(order, channel);

        expect(result!.amount.toNumber()).toBe(1500);
        expect(result!.rate.toNumber()).toBe(0.15);
    });

    it('should calculate tiered commission correctly based on amount brackets', async () => {
        const order = { totalAmount: '15000', items: [], tenantId: 't1' };
        const channel = {
            cooperationMode: 'COMMISSION',
            commissionType: 'TIERED',
            tieredRates: [
                { minAmount: 0, maxAmount: 10000, rate: 0.10 },
                { minAmount: 10000, maxAmount: 20000, rate: 0.20 },
                { minAmount: 20000, rate: 0.30 }
            ]
        };

        const result = await calculateOrderCommission(order, channel);

        // 15000 hits the second tier: 10000 <= 15000 < 20000 (rate: 0.2)
        expect(result!.amount.toNumber()).toBe(3000);
        expect(result!.rate.toNumber()).toBe(0.20);
        expect(result!.formula.mode).toBe('COMMISSION');
    });

    it('should return null if calculated amount is 0', async () => {
        const order = { totalAmount: '0', items: [], tenantId: 't1' };
        const channel = { cooperationMode: 'COMMISSION', commissionRate: 0.1 };

        const result = await calculateOrderCommission(order, channel);

        expect(result).toBeNull();
    });

    it('should calculate base price margin mode correctly', async () => {
        const order = {
            totalAmount: '2000',
            items: [{ productId: 'p1', unitPrice: 1000, quantity: 2, productName: 'Item 1' }],
            tenantId: 't1'
        };
        const channel = { cooperationMode: 'BASE_PRICE', level: 'S' };

        // mock grade discounts configuration
        mockQueryFindFirst.mockResolvedValueOnce({ configValue: '{"S":0.90}' });
        // mock product base price
        mockQueryFindMany.mockResolvedValueOnce([{ id: 'p1', channelPrice: '500', name: 'Item 1' }]);

        const result = await calculateOrderCommission(order, channel);

        // Base Price = 500. Discount (S) = 0.9. Discounted Cost = 450
        // Retail Price = 1000. Profit per unit = 1000 - 450 = 550.
        // Total Profit = 550 * 2 = 1100
        expect(result).toBeDefined();
        expect(result!.type).toBe('BASE_PRICE');
        expect(result!.amount.toNumber()).toBe(1100);
        expect(result!.formula.details).toHaveLength(1);
        expect(result!.formula.details![0].profit).toBe(1100);
    });
});

describe('Commission Service Logic - Clawback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should void PENDING commissions upon full refund', async () => {
        mockQueryFindFirst.mockResolvedValueOnce({ tenantId: 't1' });
        mockQueryFindMany.mockResolvedValueOnce([{
            id: 'comm1', tenantId: 't1', status: 'PENDING', amount: '1500', orderAmount: '10000'
        }]);

        await handleCommissionClawback('order-1', 10000);

        // check that db.update was called targeting PENDING state changing to VOID
        expect(mockUpdateChain).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'VOID' }));
    });

    it('should insert negative adjustments and decrease channel total for SETTLED commissions', async () => {
        mockQueryFindFirst.mockResolvedValueOnce({ tenantId: 't1' });
        mockQueryFindMany.mockResolvedValueOnce([{
            id: 'comm1', tenantId: 't1', status: 'SETTLED', amount: '1500', orderAmount: '10000', channelId: 'c1'
        }]);

        await handleCommissionClawback('order-1', 5000);

        // Tx handles insertions
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            adjustmentAmount: '-750.00', // (5000/10000) * 1500 = 750 clawback
            adjustmentType: 'PARTIAL_REFUND'
        }));
    });
});
