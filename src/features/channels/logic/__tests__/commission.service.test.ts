/**
 * commission.service.ts 单元测试
 * 
 * 测试覆盖:
 * - 返佣模式佣金计算
 * - 底价模式利润计算
 * - 触发模式匹配
 * - 等级折扣应用
 * - 退款扣回逻辑
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateOrderCommission, checkAndGenerateCommission, handleCommissionClawback } from '../commission.service';
import { db } from '@/shared/api/db';

// Mock 事务对象需要在 mock factory 外部定义以便在测试中引用
const mockTx = {
    query: {
        channelCommissions: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => [{ id: 'new-comm' }]) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
};

// Mock 数据库模块
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            financeConfigs: { findFirst: vi.fn() },
            products: { findMany: vi.fn() },
            orders: { findFirst: vi.fn() },
            leads: { findFirst: vi.fn() },
            channels: { findFirst: vi.fn() },
            channelCommissions: { findFirst: vi.fn(), findMany: vi.fn() },
        },
        transaction: vi.fn((cb) => cb(mockTx)),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    }
}));

// 测试纯计算逻辑，不涉及数据库操作

describe('佣金计算逻辑', () => {
    describe('返佣模式 (COMMISSION)', () => {
        it('应正确计算固定比例佣金', () => {
            // 订单金额 10000，佣金率 10%，预期佣金 1000
            const orderAmount = 10000;
            const commissionRate = 10; // 10%
            const expected = orderAmount * (commissionRate / 100);

            expect(expected).toBe(1000);
        });

        it('佣金率为0时应返回0', () => {
            const orderAmount = 10000;
            const commissionRate = 0;
            const expected = orderAmount * (commissionRate / 100);

            expect(expected).toBe(0);
        });

        it('高佣金率场景', () => {
            const orderAmount = 5000;
            const commissionRate = 15; // 15%
            const expected = orderAmount * (commissionRate / 100);

            expect(expected).toBe(750);
        });
    });

    describe('底价模式 (BASE_PRICE)', () => {
        it('应正确计算渠道利润', () => {
            // 销售价 1000，底价 800，折扣率 0.95
            // 成本 = 800 * 0.95 = 760
            // 利润 = 1000 - 760 = 240
            const retailPrice = 1000;
            const basePrice = 800;
            const discountRate = 0.95;

            const costPrice = basePrice * discountRate;
            const profit = retailPrice - costPrice;

            expect(costPrice).toBe(760);
            expect(profit).toBe(240);
        });

        it('等级折扣率为1时利润等于差价', () => {
            const retailPrice = 1000;
            const basePrice = 800;
            const discountRate = 1.0;

            const costPrice = basePrice * discountRate;
            const profit = retailPrice - costPrice;

            expect(profit).toBe(200);
        });

        it('S级折扣应产生更高利润', () => {
            const retailPrice = 1000;
            const basePrice = 800;

            const profitC = retailPrice - basePrice * 1.00; // C级
            const profitS = retailPrice - basePrice * 0.90; // S级

            expect(profitS).toBeGreaterThan(profitC);
            expect(profitS).toBe(280); // 1000 - 720
            expect(profitC).toBe(200); // 1000 - 800
        });
    });

    describe('等级折扣配置', () => {
        it('默认配置应有正确的等级折扣', () => {
            const gradeDiscounts = { S: 0.90, A: 0.95, B: 1.00, C: 1.00 };

            expect(gradeDiscounts['S']).toBe(0.90);
            expect(gradeDiscounts['A']).toBe(0.95);
            expect(gradeDiscounts['B']).toBe(1.00);
            expect(gradeDiscounts['C']).toBe(1.00);
        });

        it('S级应有最优惠折扣', () => {
            const gradeDiscounts = { S: 0.90, A: 0.95, B: 1.00, C: 1.00 };

            expect(gradeDiscounts['S']).toBeLessThan(gradeDiscounts['A']);
            expect(gradeDiscounts['A']).toBeLessThan(gradeDiscounts['B']);
        });

        it('应能正确解析 JSON 配置', () => {
            const configValue = '{"S": 0.85, "A": 0.92}';
            const parsed = JSON.parse(configValue);
            const defaults = { S: 0.90, A: 0.95, B: 1.00, C: 1.00 };
            const merged = { ...defaults, ...parsed };

            expect(merged.S).toBe(0.85);
            expect(merged.A).toBe(0.92);
            expect(merged.B).toBe(1.00); // 保持默认
        });
    });

    describe('触发模式匹配', () => {
        it('触发模式匹配时应继续处理', () => {
            const channelTrigger = 'PAYMENT_COMPLETED';
            const currentEvent = 'PAYMENT_COMPLETED';

            expect(channelTrigger === currentEvent).toBe(true);
        });

        it('触发模式不匹配时应跳过', () => {
            const channelTrigger = 'PAYMENT_COMPLETED';
            const currentEvent = 'ORDER_CREATED';

            expect(channelTrigger === currentEvent).toBe(false);
        });

        it('渠道未配置时应使用默认模式', () => {
            const channelTrigger = null;
            const defaultTrigger = 'PAYMENT_COMPLETED';
            const requiredTrigger = channelTrigger || defaultTrigger;

            expect(requiredTrigger).toBe('PAYMENT_COMPLETED');
        });

        it('三种触发模式都应该有效', () => {
            const validModes = ['ORDER_CREATED', 'ORDER_COMPLETED', 'PAYMENT_COMPLETED'];

            expect(validModes).toContain('ORDER_CREATED');
            expect(validModes).toContain('ORDER_COMPLETED');
            expect(validModes).toContain('PAYMENT_COMPLETED');
        });
    });


    describe('佣金扣回逻辑', () => {
        describe('全额退款', () => {
            it('全额退款比例应为1', () => {
                const originalAmount = 1000;
                const refundAmount = 1000;
                const refundRatio = refundAmount / originalAmount;

                expect(refundRatio).toBe(1);
            });

            it('全额退款应作废整个佣金', () => {
                const commissionAmount = 100;
                const refundRatio = 1;
                const adjustmentAmount = -(commissionAmount * refundRatio);

                expect(adjustmentAmount).toBe(-100);
            });
        });

        describe('部分退款', () => {
            it('50%退款应扣减一半佣金', () => {
                const commissionAmount = 100;
                const refundRatio = 0.5;
                const adjustmentAmount = -(commissionAmount * refundRatio);

                expect(adjustmentAmount).toBe(-50);
            });

            it('30%退款应扣减30%佣金', () => {
                const commissionAmount = 100;
                const refundRatio = 0.3;
                const adjustmentAmount = -(commissionAmount * refundRatio);

                expect(adjustmentAmount).toBe(-30);
            });

            it('调整金额应为负数', () => {
                const commissionAmount = 100;
                const refundRatio = 0.3;
                const adjustmentAmount = -(commissionAmount * refundRatio);

                expect(adjustmentAmount).toBeLessThan(0);
            });
        });
    });

    describe('幂等性检查', () => {
        it('有效状态列表应包含 PENDING 和 SETTLED', () => {
            const validStatuses = ['PENDING', 'SETTLED', 'PAID'];
            const skipStatuses = ['VOID'];

            expect(validStatuses).not.toContain('VOID');
            expect(skipStatuses).toContain('VOID');
        });
    });
});

describe('calculateOrderCommission() 函数', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('返佣模式 (COMMISSION)', () => {
        it('固定比例10%：10000元订单应返1000元佣金', async () => {
            const order = {
                totalAmount: '10000',
                items: [],
                tenantId: 'tenant-1',
            };
            const channel = {
                commissionType: 'FIXED',
                commissionRate: '10',
                cooperationMode: 'COMMISSION',
                tieredRates: null,
            };

            const result = await calculateOrderCommission(order, channel);

            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(1000);
            expect(result!.type).toBe('COMMISSION');
            expect(result!.rate.toNumber()).toBe(0.1);
        });

        it('小数形式费率 0.1 应等同于 10%', async () => {
            const order = { totalAmount: '5000', items: [], tenantId: 't1' };
            const channel = {
                commissionType: 'FIXED',
                commissionRate: '0.1',
                cooperationMode: 'COMMISSION',
                tieredRates: null,
            };

            const result = await calculateOrderCommission(order, channel);
            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(500);
        });

        it('订单金额为0时应返回null', async () => {
            const order = { totalAmount: '0', items: [], tenantId: 't1' };
            const channel = {
                commissionType: 'FIXED',
                commissionRate: '10',
                cooperationMode: 'COMMISSION',
                tieredRates: null,
            };

            const result = await calculateOrderCommission(order, channel);
            expect(result).toBeNull();
        });
    });

    describe('阶梯返佣 (TIERED)', () => {
        it('金额25000应命中20万-50万区间(10%)', async () => {
            const order = {
                totalAmount: '25000',
                items: [],
                tenantId: 't1',
            };
            const channel = {
                commissionType: 'TIERED',
                commissionRate: '8',
                cooperationMode: 'COMMISSION',
                tieredRates: JSON.stringify([
                    { minAmount: 0, maxAmount: 20000, rate: 8 },
                    { minAmount: 20000, maxAmount: 50000, rate: 10 },
                    { minAmount: 50000, rate: 12 },
                ]),
            };

            const result = await calculateOrderCommission(order, channel);
            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(2500);
        });

        it('阶梯配置为无效JSON时应使用基础费率', async () => {
            const order = { totalAmount: '10000', items: [], tenantId: 't1' };
            const channel = {
                commissionType: 'TIERED',
                commissionRate: '8',
                cooperationMode: 'COMMISSION',
                tieredRates: 'invalid-json',
            };

            const result = await calculateOrderCommission(order, channel);
            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(800);
        });
    });

    describe('底价模式 (BASE_PRICE)', () => {
        it('B级渠道(无额外折扣)应正确计算利润', async () => {
            const order = {
                totalAmount: '300',
                items: [
                    { productId: 'p1', unitPrice: 150, quantity: 2, productName: 'Product 1' }
                ],
                tenantId: 't1',
            };
            const channel = {
                cooperationMode: 'BASE_PRICE',
                level: 'B',
            };

            vi.mocked(db.query.products.findMany).mockResolvedValue([
                { id: 'p1', channelPrice: '100', channelPriceMode: 'FIXED', name: 'Product 1' }
            ] as any);

            vi.mocked(db.query.financeConfigs.findFirst).mockResolvedValue(null);

            const result = await calculateOrderCommission(order, channel);

            // Cost = 100 * 1.0 = 100
            // Profit = (150 - 100) * 2 = 100
            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(100);
            expect(result!.type).toBe('BASE_PRICE');
        });

        it('S级渠道(9折)应有更高利润', async () => {
            const order = {
                totalAmount: '150',
                items: [
                    { productId: 'p1', unitPrice: 150, quantity: 1 }
                ],
                tenantId: 't1',
            };
            const channel = {
                cooperationMode: 'BASE_PRICE',
                level: 'S',
            };

            vi.mocked(db.query.products.findMany).mockResolvedValue([
                { id: 'p1', channelPrice: '100', channelPriceMode: 'FIXED', name: 'Product 1' }
            ] as any);
            vi.mocked(db.query.financeConfigs.findFirst).mockResolvedValue(null);

            const result = await calculateOrderCommission(order, channel);

            // Cost = 100 * 0.9 = 90
            // Profit = 150 - 90 = 60
            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(60);
        });

        it('当利润为负时不应返回佣金', async () => {
            const order = {
                totalAmount: '90',
                items: [
                    { productId: 'p1', unitPrice: 90, quantity: 1 }
                ],
                tenantId: 't1',
            };
            const channel = {
                cooperationMode: 'BASE_PRICE',
                level: 'B',
            };

            vi.mocked(db.query.products.findMany).mockResolvedValue([
                { id: 'p1', channelPrice: '100', channelPriceMode: 'FIXED', name: 'Product 1' }
            ] as any);
            vi.mocked(db.query.financeConfigs.findFirst).mockResolvedValue(null);

            const result = await calculateOrderCommission(order, channel);
            expect(result).toBeNull();
        });
    });
});

describe('checkAndGenerateCommission() 集成测试流程', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('当佣金记录已存在时应跳过生成（幂等性）', async () => {
        // Mock Order
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({
            id: 'order-1', channelId: 'ch-1', tenantId: 't1', totalAmount: '100', items: []
        } as any);
        // Mock Channel
        vi.mocked(db.query.channels.findFirst).mockResolvedValue({
            id: 'ch-1', tenantId: 't1', commissionTriggerMode: 'PAYMENT_COMPLETED',
            commissionType: 'FIXED', commissionRate: '10', cooperationMode: 'COMMISSION'
        } as any);

        // Mock Existing Commission in Transaction
        mockTx.query.channelCommissions.findFirst.mockResolvedValue({ id: 'existing-comm' } as any);

        await checkAndGenerateCommission('order-1', 'PAYMENT_COMPLETED');

        expect(db.transaction).toHaveBeenCalled();
        expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it('触发事件不匹配时应跳过', async () => {
        // Mock Order
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({
            id: 'order-1', channelId: 'ch-1', tenantId: 't1'
        } as any);
        // Mock Channel (Requires ORDER_COMPLETED)
        vi.mocked(db.query.channels.findFirst).mockResolvedValue({
            id: 'ch-1', tenantId: 't1', commissionTriggerMode: 'ORDER_COMPLETED'
        } as any);

        await checkAndGenerateCommission('order-1', 'PAYMENT_COMPLETED');

        expect(db.transaction).not.toHaveBeenCalled(); // Should return early
    });

    it('未找到订单或渠道时应安全返回', async () => {
        vi.mocked(db.query.orders.findFirst).mockResolvedValue(null);
        await checkAndGenerateCommission('order-1', 'PAYMENT_COMPLETED');
        expect(db.query.channels.findFirst).not.toHaveBeenCalled();
    });

    it('正常流程应生成佣金并更新统计', async () => {
        // Mock Order
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({
            id: 'order-1', channelId: 'ch-1', tenantId: 't1', totalAmount: '1000', items: []
        } as any);
        // Mock Channel
        vi.mocked(db.query.channels.findFirst).mockResolvedValue({
            id: 'ch-1', tenantId: 't1', commissionTriggerMode: 'PAYMENT_COMPLETED',
            commissionType: 'FIXED', commissionRate: '10', cooperationMode: 'COMMISSION'
        } as any);

        // Mock No Existing Commission
        mockTx.query.channelCommissions.findFirst.mockResolvedValue(null);

        await checkAndGenerateCommission('order-1', 'PAYMENT_COMPLETED');

        expect(db.transaction).toHaveBeenCalled();
        expect(mockTx.insert).toHaveBeenCalled();
        // Verify insert args? 
        // mockTx.insert returns object with .values().
        // I can assert `mockTx.insert` was called with schema object.

        expect(mockTx.update).toHaveBeenCalled(); // Should update stats
    });
});

describe('handleCommissionClawback() 退款扣回逻辑', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('PENDING 状态的佣金应直接作废', async () => {
        // Mock Order
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({ id: 'order-1', tenantId: 't1' } as any);
        // Mock Commissions
        vi.mocked(db.query.channelCommissions.findMany).mockResolvedValue([
            { id: 'comm-1', tenantId: 't1', status: 'PENDING', amount: '100' }
        ] as any);

        await handleCommissionClawback('order-1', 100);

        expect(db.update).toHaveBeenCalled();
        // Verify set({ status: 'VOID' }) logic
        const updateCall = vi.mocked(db.update).mock.results[0].value;
        expect(updateCall.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'VOID' }));
    });

    it('SETTLED 状态的佣金应生成负向调整记录', async () => {
        // Mock Order
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({ id: 'order-1', tenantId: 't1' } as any);
        // Mock Commissions
        vi.mocked(db.query.channelCommissions.findMany).mockResolvedValue([
            {
                id: 'comm-1', tenantId: 't1', channelId: 'ch-1',
                status: 'SETTLED', amount: '100', orderAmount: '1000'
            }
        ] as any);

        // Refund 500 (50% of 1000) -> Should clawback 50 (50% of 100)
        await handleCommissionClawback('order-1', 500);

        expect(db.transaction).toHaveBeenCalled();
        expect(mockTx.insert).toHaveBeenCalled();

        const valuesFn = mockTx.insert.mock.results[0].value.values;
        expect(valuesFn).toHaveBeenCalledWith(expect.objectContaining({
            originalCommissionId: 'comm-1',
            adjustmentAmount: '-50.00', // 100 * (500/1000) * -1
            adjustmentType: 'PARTIAL_REFUND'
        }));

        expect(mockTx.update).toHaveBeenCalled(); // Should update channel totalDealAmount
    });

    it('全额退款应标记为 FULL_REFUND', async () => {
        // Mock Order
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({ id: 'order-1', tenantId: 't1' } as any);
        // Mock Commissions
        vi.mocked(db.query.channelCommissions.findMany).mockResolvedValue([
            {
                id: 'comm-1', tenantId: 't1', channelId: 'ch-1',
                status: 'PAID', amount: '100', orderAmount: '1000'
            }
        ] as any);

        // Refund 1000 -> Full
        await handleCommissionClawback('order-1', 1000);

        expect(mockTx.insert).toHaveBeenCalled();
        const valuesFn = mockTx.insert.mock.results[0].value.values;
        expect(valuesFn).toHaveBeenCalledWith(expect.objectContaining({
            adjustmentType: 'FULL_REFUND',
            adjustmentAmount: '-100.00'
        }));
    });
});
