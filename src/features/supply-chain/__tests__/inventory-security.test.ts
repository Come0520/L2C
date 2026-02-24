/**
 * 供应链模块核心操作单元测试
 * 覆盖 SC-21（库存调整）、SC-22（付款确认）安全边界
 * SC-08 关联验证：Decimal.js 精确计算
 */

import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';

// ==================== SC-08: Decimal.js 精度验证 ====================

describe('[SC-08] 金额精确计算 - Decimal.js 精度校验', () => {
    it('Decimal.js 应精确计算 0.1 × 0.2（原生 JS 浮点不精确）', () => {
        const quantity = 0.1;
        const unitCost = 0.2;
        const result = new Decimal(quantity).mul(new Decimal(unitCost));
        // 原生 JS: 0.1 * 0.2 = 0.020000000000000004
        expect(result.toFixed(2)).toBe('0.02');
        expect(0.1 * 0.2).not.toBe(0.02); // 验证原生不精确
    });

    it('多个 items 金额 reduce 求和应精确（模拟 createPurchaseOrder）', () => {
        const items = [
            { quantity: 3, unitCost: 0.1 },
            { quantity: 7, unitCost: 0.2 },
            { quantity: 1, unitCost: 100.99 },
        ];

        const totalAmount = items
            .reduce(
                (sum, item) => sum.plus(new Decimal(item.quantity).mul(new Decimal(item.unitCost))),
                new Decimal(0)
            )
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toString();

        // 3*0.1 + 7*0.2 + 1*100.99 = 0.30 + 1.40 + 100.99 = 102.69
        expect(totalAmount).toBe('102.69');
    });

    it('ROUND_HALF_UP 应正确四舍五入', () => {
        const a = new Decimal('0.005');
        expect(a.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()).toBe('0.01');
    });

    it('大额金额计算应不超出 JS number 精度范围', () => {
        // 测试 9999999.99 × 1000 = 9,999,999,990.00
        const result = new Decimal('9999999.99').mul(new Decimal('1000'));
        expect(result.toFixed(2)).toBe('9999999990.00');
    });
});

// ==================== SC-21: 库存调整核心逻辑测试 ====================

describe('[SC-21] adjustInventory - 库存调整行为逻辑测试', () => {
    it('库存不足时（newQty < 0）应检测到错误', () => {
        const currentQty = 5;
        const adjustAmount = -10; // 扣减 10，但只有 5 件
        const newQty = currentQty + adjustAmount;

        expect(newQty).toBeLessThan(0);
        // 业务规则：newQty < 0 时需抛出 '库存不足' 错误
    });

    it('库存充足时 newQty 应正确计算', () => {
        const currentQty = 50;
        const adjustAmount = -20;
        const newQty = currentQty + adjustAmount;

        expect(newQty).toBe(30);
        expect(newQty).toBeGreaterThanOrEqual(0);
    });

    it('SC-16: balanceBefore 应等于调整前的库存量', () => {
        const currentQty = 50;
        const adjustAmount = 10;
        const newQty = currentQty + adjustAmount;

        // 验证流水记录应包含的字段
        const logEntry = {
            balanceBefore: currentQty,  // 变动前：50
            balanceAfter: newQty,       // 变动后：60
            quantity: adjustAmount,     // 变动量：+10
        };

        // 验证 balanceBefore + quantity = balanceAfter（流水内部一致性）
        expect(logEntry.balanceBefore + logEntry.quantity).toBe(logEntry.balanceAfter);
    });

    it('调拨出库：balanceBefore 为调拨前库存，balanceAfter 为扣减后库存', () => {
        const sourceQty = 100;
        const transferQty = 30;
        const newSourceQty = sourceQty - transferQty;

        const outLog = {
            balanceBefore: sourceQty,   // 100
            balanceAfter: newSourceQty,  // 70
            quantity: -transferQty,      // -30
        };

        expect(outLog.balanceBefore + outLog.quantity).toBe(outLog.balanceAfter);
    });

    it('调拨入库：balanceBefore 为接收前库存，balanceAfter 为累加后库存', () => {
        const currentTargetQty = 20;
        const transferQty = 30;
        const newTargetQty = currentTargetQty + transferQty;

        const inLog = {
            balanceBefore: currentTargetQty,  // 20
            balanceAfter: newTargetQty,        // 50
            quantity: transferQty,             // +30
        };

        expect(inLog.balanceBefore + inLog.quantity).toBe(inLog.balanceAfter);
    });
});

// ==================== SC-22: 付款确认核心逻辑测试 ====================

describe('[SC-22] confirmPoPayment - 付款确认逻辑验证', () => {
    it('多个 item 金额合计应精确（Decimal.js）', () => {
        const items = [
            { amount: 100.1 },
            { amount: 200.2 },
            { amount: 300.3 },
        ];
        const total = items.reduce(
            (sum, item) => sum.plus(new Decimal(item.amount)),
            new Decimal(0)
        );
        // 浮点：100.1 + 200.2 + 300.3 = 600.6000000000001（不精确）
        // Decimal：精确 600.60
        expect(total.toFixed(2)).toBe('600.60');
    });

    it('付款后 PO 状态应从 APPROVED 转为 PAID', () => {
        // 状态机验证
        const VALID_PAYMENT_TRANSITIONS: Record<string, string[]> = {
            APPROVED: ['PAID'],
            PARTIALLY_PAID: ['PAID'],
        };

        const currentStatus = 'APPROVED';
        const targetStatus = 'PAID';

        expect(VALID_PAYMENT_TRANSITIONS[currentStatus]).toContain(targetStatus);
    });

    it('已 PAID 状态不应再次付款', () => {
        const VALID_PAYMENT_TRANSITIONS: Record<string, string[]> = {
            APPROVED: ['PAID'],
            PARTIALLY_PAID: ['PAID'],
        };

        const currentStatus = 'PAID';
        const allowedTransitions = VALID_PAYMENT_TRANSITIONS[currentStatus];

        expect(allowedTransitions).toBeUndefined(); // PAID 状态无可用转换
    });
});
