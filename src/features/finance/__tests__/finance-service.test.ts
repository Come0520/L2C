import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FinanceService } from '@/services/finance.service';
import { db } from '@/shared/api/db';
import { paymentSchedules, arStatements, commissionRecords, financeAccounts } from '@/shared/api/schema';
import { Decimal } from 'decimal.js';
import { getFinanceConfigCached } from '@/features/finance/services/finance-config-service';
import { isWithinAllowedDifference } from '@/features/finance/services/finance-config-utils';

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: '1' }]),
            }),
        }),
        transaction: vi.fn(),
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('@/features/finance/services/finance-config-service', () => ({
    getFinanceConfigCached: vi.fn(),
}));

vi.mock('@/features/finance/services/finance-config-utils', () => ({
    isWithinAllowedDifference: vi.fn(),
}));

describe('FinanceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateReceivables', () => {
        it('should generate correct payment schedules based on ratios', async () => {
            const result = await FinanceService.generateReceivables('order-1', '1000', 'tenant-1', [0.6, 0.4]);

            expect(db.insert).toHaveBeenCalledWith(paymentSchedules);
            const insertCall = (db.insert(paymentSchedules).values as any).mock.calls[0][0];
            expect(insertCall).toHaveLength(2);
            expect(insertCall[0].amount).toBe('600');
            expect(insertCall[1].amount).toBe('400');
        });

        it('should handle rounding for last installment', async () => {
            // 100 / 3 = 33.333...
            // r1: 33.33, r2: 33.33, r3: 33.34
            // Note: generateReceivables uses toDecimalPlaces(2)
            await FinanceService.generateReceivables('order-1', '100', 'tenant-1', [0.3333, 0.3333, 0.3334]);

            const insertCall = (db.insert(paymentSchedules).values as any).mock.calls[0][0];
            expect(insertCall).toHaveLength(3);

            // Decimal('100').times(0.3333).toDecimalPlaces(2) -> 33.33
            // 1st: 33.33
            // 2nd: 33.33
            // 3rd: 100 - 66.66 = 33.34
            expect(insertCall[0].amount).toBe('33.33');
            expect(insertCall[1].amount).toBe('33.33');
            expect(insertCall[2].amount).toBe('33.34');
        });
    });

    describe('validateDownPaymentRatio', () => {
        it('should return true if ratio is met', () => {
            const result = FinanceService.validateDownPaymentRatio('600', '1000', 0.5);
            expect(result).toBe(true);
        });

        it('should return false if ratio is not met', () => {
            const result = FinanceService.validateDownPaymentRatio('400', '1000', 0.5);
            expect(result).toBe(false);
        });

        it('should return true if total amount is 0', () => {
            const result = FinanceService.validateDownPaymentRatio('0', '0');
            expect(result).toBe(true);
        });
    });

    describe('createPaymentOrder', () => {
        it('should create payment order within a transaction', async () => {
            const mockTx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'p-1', paymentNo: 'PAY-1' }]),
                    }),
                }),
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const data = {
                customerName: 'Test',
                customerPhone: '123',
                totalAmount: '1000',
                paymentMethod: 'CASH',
                proofUrl: 'test.png',
                receivedAt: new Date(),
                items: [],
            };

            await FinanceService.createPaymentOrder(data as any, 'tenant-1', 'user-1');
            expect(mockTx.insert).toHaveBeenCalled();
        });

        it('should create payment order with items', async () => {
            const mockTx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'p-2', paymentNo: 'PAY-2' }]),
                    }),
                }),
                query: {
                    orders: {
                        findFirst: vi.fn().mockResolvedValue({ id: 'ord-1', orderNo: 'ORD-001' }),
                    },
                },
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const data = {
                customerName: 'Test Item',
                customerPhone: '123',
                totalAmount: '1000',
                paymentMethod: 'CASH',
                proofUrl: 'test.png',
                receivedAt: new Date(),
                items: [{ orderId: 'ord-1', amount: 1000 }],
            };

            await FinanceService.createPaymentOrder(data as any, 'tenant-1', 'user-1');
            // insert 应被调用两次：一次 paymentOrders，一次 paymentOrderItems
            expect(mockTx.insert).toHaveBeenCalledTimes(2);
        });
    });

    describe('generateReceivables Edge Cases', () => {
        it('should throw error if ratios do not sum to 1', async () => {
            await expect(FinanceService.generateReceivables('order-1', '1000', 'tenant-1', [0.5, 0.4]))
                .rejects.toThrow('Payment ratios must sum to 1');
        });
    });

    describe('verifyPaymentOrder (含佣金计算)', () => {
        /**
         * 通过 verifyPaymentOrder 间接测试 private calculateCommission
         */

        // 创建通用 mockTx 工厂
        const createMockTx = () => {
            const valuesMock = vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'inserted-id' }]),
            });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

            const tx: any = {
                query: {
                    paymentOrders: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: 'order-pay-1',
                            paymentNo: 'PAY-001',
                            status: 'PENDING',
                            totalAmount: '10000',
                            accountId: 'acc-1',
                            items: [{ orderId: 'ord-1', amount: '10000' }],
                        }),
                    },
                    financeAccounts: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: 'acc-1',
                            balance: '50000',
                        }),
                    },
                    arStatements: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: 'stmt-1',
                            orderId: 'ord-1',
                            totalAmount: '10000',
                            receivedAmount: '0',
                            pendingAmount: '10000',
                            status: 'PENDING',
                            channelId: 'ch-1',
                            channel: {
                                id: 'ch-1',
                                name: '渠道A',
                                cooperationMode: 'REBATE',
                                commissionRate: '0.1',
                            },
                        }),
                    },
                    orderItems: { findMany: vi.fn().mockResolvedValue([]) },
                    products: { findMany: vi.fn().mockResolvedValue([]) },
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
                        }),
                    }),
                }),
                insert: insertMock,
                // 用于辅助断言：寻找特定表的 values 调用数据
                _getValues: (table: any) => {
                    const insertCallIndex = insertMock.mock.calls.findIndex(c => c[0] === table);
                    if (insertCallIndex === -1) return null;
                    return valuesMock.mock.calls[insertCallIndex][0];
                },
                _getUpdate: (table: any) => {
                    const updateCallIndex = tx.update.mock.calls.findIndex((c: any) => c[0] === table);
                    if (updateCallIndex === -1) return null;
                    return (tx.update(table).set as any).mock.calls[updateCallIndex][0];
                }
            };
            return tx;
        };

        it('REBATE 模式：应按订单金额 * 费率计算佣金', async () => {
            const mockTx = createMockTx();
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await FinanceService.verifyPaymentOrder('order-pay-1', 'VERIFIED', 'tenant-1', 'user-1');

            expect(result).toEqual({ success: true });
            expect(mockTx.insert).toHaveBeenCalledWith(commissionRecords);
            const commissionData = mockTx._getValues(commissionRecords);
            expect(commissionData.commissionAmount).toBe('1000'); // 10000 * 0.1
        });

        it('REJECTED 状态：不应触发佣金计算', async () => {
            const mockTx = createMockTx();
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await FinanceService.verifyPaymentOrder('order-pay-1', 'REJECTED', 'tenant-1', 'user-1');

            expect(result).toEqual({ success: true });
            // REJECTED 只更新状态，不会调用 insert（无佣金计算）
            expect(mockTx.insert).not.toHaveBeenCalledWith(commissionRecords);
        });

        it('无渠道 (channelId=null)：不应生成佣金记录', async () => {
            const mockTx = createMockTx();
            (mockTx.query.arStatements.findFirst as any).mockResolvedValue({
                id: 'stmt-1',
                orderId: 'ord-1',
                totalAmount: '10000',
                receivedAmount: '0',
                pendingAmount: '10000',
                status: 'PENDING',
                channelId: null,
                channel: null,
            });
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await FinanceService.verifyPaymentOrder('order-pay-1', 'VERIFIED', 'tenant-1', 'user-1');

            expect(result).toEqual({ success: true });
            expect(mockTx.insert).not.toHaveBeenCalledWith(commissionRecords);
        });

        it('PARTIAL 状态：部分收款应更新 receivedAmount 并保持 PARTIAL 状态', async () => {
            const mockTx = createMockTx();
            (mockTx.query.paymentOrders.findFirst as any).mockResolvedValue({
                id: 'order-pay-partial',
                status: 'PENDING', // 必须为 PENDING 才能通过校验
                totalAmount: '10000',
                items: [{ orderId: 'ord-1', amount: '5000' }],
            });
            (mockTx.query.arStatements.findFirst as any).mockResolvedValue({
                id: 'stmt-1',
                orderId: 'ord-1',
                totalAmount: '10000',
                receivedAmount: '0',
                pendingAmount: '10000',
                status: 'PENDING',
            });

            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            await FinanceService.verifyPaymentOrder('order-pay-partial', 'VERIFIED', 'tenant-1', 'user-1');

            const arUpdate = mockTx._getUpdate(arStatements);
            expect(arUpdate).toBeDefined();
            expect(arUpdate.status).toBe('PARTIAL');
            expect(arUpdate.receivedAmount).toBe('5000');
        });

        it('小额差异处理：如果余款在允许范围内，状态应设为 PAID', async () => {
            const mockTx = createMockTx();
            (mockTx.query.paymentOrders.findFirst as any).mockResolvedValue({
                id: 'order-pay-diff',
                status: 'PENDING',
                totalAmount: '0',
                items: [{ orderId: 'ord-1', amount: '0' }],
            });
            (mockTx.query.arStatements.findFirst as any).mockResolvedValue({
                id: 'stmt-1',
                totalAmount: '10000',
                receivedAmount: '9999',
                pendingAmount: '1',
                status: 'PARTIAL',
            });

            (getFinanceConfigCached as any).mockResolvedValue({
                allow_difference: true,
                max_difference_amount: 5,
            });
            (isWithinAllowedDifference as any).mockReturnValue(true);

            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            await FinanceService.verifyPaymentOrder('order-pay-diff', 'VERIFIED', 'tenant-1', 'user-1');

            const arUpdate = mockTx._getUpdate(arStatements);
            expect(arUpdate).toBeDefined();
            expect(arUpdate.status).toBe('PAID');
        });

        it('BASE_PRICE 模式：应按 (成交价 - 结算底价) * 费率计算佣金', async () => {
            const mockTx = createMockTx();
            (mockTx.query.arStatements.findFirst as any).mockResolvedValue({
                id: 'stmt-base',
                orderId: 'ord-1',
                totalAmount: '10000',
                receivedAmount: '0',
                pendingAmount: '10000',
                status: 'PENDING',
                channelId: 'ch-1',
                channel: {
                    id: 'ch-1',
                    cooperationMode: 'BASE_PRICE',
                    commissionRate: '0.1',
                },
            });
            (mockTx.query.orderItems.findMany as any).mockResolvedValue([{ productId: 'p1', quantity: 1 }]);
            (mockTx.query.products.findMany as any).mockResolvedValue([{ id: 'p1', floorPrice: '6000' }]);

            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            await FinanceService.verifyPaymentOrder('order-pay-1', 'VERIFIED', 'tenant-1', 'user-1');

            const commissionData = mockTx._getValues(commissionRecords);
            expect(commissionData).toBeDefined();
            expect(commissionData.commissionAmount).toBe('400');
        });

        it('BASE_PRICE 模式：利润为负时不应生成佣金', async () => {
            const mockTx = createMockTx();
            (mockTx.query.arStatements.findFirst as any).mockResolvedValue({
                id: 'stmt-negative',
                totalAmount: '5000',
                receivedAmount: '0',
                pendingAmount: '5000',
                status: 'PENDING',
                channelId: 'ch-1',
                channel: { cooperationMode: 'BASE_PRICE', commissionRate: '0.1' },
            });
            (mockTx.query.orderItems.findMany as any).mockResolvedValue([{ productId: 'p1', quantity: 1 }]);
            (mockTx.query.products.findMany as any).mockResolvedValue([{ id: 'p1', floorPrice: '6000' }]);

            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            await FinanceService.verifyPaymentOrder('order-pay-1', 'VERIFIED', 'tenant-1', 'user-1');

            expect(mockTx.insert).not.toHaveBeenCalledWith(commissionRecords);
        });
    });
});
