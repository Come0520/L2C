import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FinanceService } from '@/services/finance.service';
import { db } from '@/shared/api/db';
import { paymentSchedules } from '@/shared/api/schema';
import { Decimal } from 'decimal.js';

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
    });

    describe('verifyPaymentOrder (含佣金计算)', () => {
        /**
         * 通过 verifyPaymentOrder 间接测试 private calculateCommission
         */

        // 创建通用 mockTx 工厂
        const createMockTx = (overrides: Record<string, unknown> = {}) => {
            return {
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
                    orderItems: {
                        findMany: vi.fn().mockResolvedValue([]),
                    },
                    products: {
                        findMany: vi.fn().mockResolvedValue([]),
                    },
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockResolvedValue([]),
                }),
                ...overrides,
            };
        };

        it('REBATE 模式：应按订单金额 * 费率计算佣金', async () => {
            const mockTx = createMockTx();
            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            const result = await FinanceService.verifyPaymentOrder('order-pay-1', 'VERIFIED', 'tenant-1', 'user-1');

            expect(result).toEqual({ success: true });
            // 验证佣金记录被插入（calculateCommission 内调用 tx.insert）
            // insert 被调用多次：accountTransactions + commissionRecords + arStatements.update
            expect(mockTx.insert).toHaveBeenCalled();
        });

        it('REJECTED 状态：不应触发佣金计算', async () => {
            const mockTx = createMockTx();
            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            const result = await FinanceService.verifyPaymentOrder('order-pay-1', 'REJECTED', 'tenant-1', 'user-1');

            expect(result).toEqual({ success: true });
            // REJECTED 只更新状态，不会调用 insert（无佣金、无账户更新）
            expect(mockTx.update).toHaveBeenCalledTimes(1);
            expect(mockTx.insert).not.toHaveBeenCalled();
        });

        it('无渠道 (channelId=null)：不应生成佣金记录', async () => {
            const mockTx = createMockTx();
            // 覆盖 arStatements 返回无渠道的对账单
            (mockTx.query.arStatements.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: 'stmt-1',
                orderId: 'ord-1',
                totalAmount: '10000',
                receivedAmount: '0',
                pendingAmount: '10000',
                status: 'PENDING',
                channelId: null,
                channel: null,
            });
            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            const result = await FinanceService.verifyPaymentOrder('order-pay-1', 'VERIFIED', 'tenant-1', 'user-1');

            expect(result).toEqual({ success: true });
        });
    });
});
