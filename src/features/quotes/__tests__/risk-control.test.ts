import { describe, test, expect } from 'vitest';
import { checkDiscountRisk } from '../logic/risk-control';
import { QuoteItem } from '@/shared/api/schema/quotes';

describe('Discount Risk Control', () => {
    const mockItems = [
        {
            quantity: '2',
            costPrice: '100', // Total Cost: 200
            unitPrice: '200',
            subtotal: '400'
        }
    ] as QuoteItem[];

    const mockSettings = {
        quoteConfig: {
            minDiscountRate: 0.8,
            minProfitMargin: 0.15
        }
    };

    test('should pass valid quote', () => {
        const result = checkDiscountRisk(
            mockItems,
            380, // Final: 380, Cost: 200, Margin: 47%, Discount: 0.95
            400, // Original
            mockSettings
        );
        expect(result.isRisk).toBe(false);
        expect(result.hardStop).toBe(false);
    });

    test('should detect high discount (Soft Stop)', () => {
        const result = checkDiscountRisk(
            mockItems,
            300, // Final: 300, Original: 400 => Discount: 0.75 < 0.8
            400,
            mockSettings
        );
        expect(result.isRisk).toBe(true);
        expect(result.hardStop).toBe(false);
        expect(result.reason[0]).toContain('低于最低折扣限制');
    });

    test('should detect low margin (Soft Stop)', () => {
        // Final: 220, Cost: 200 => Margin: 20/220 = 0.09 < 0.15
        // 同时: Discount = 220/400 = 0.55 < 0.8 (也触发折扣风险)
        const result = checkDiscountRisk(
            mockItems,
            220,
            400,
            mockSettings
        );
        expect(result.isRisk).toBe(true);
        expect(result.hardStop).toBe(false);
        // 折扣检查先于毛利检查触发，所以 reason[0] 是折扣相关
        // reason 数组中应同时包含折扣和毛利警告
        expect(result.reason.length).toBeGreaterThanOrEqual(1);
        // 确保至少有一个原因包含毛利相关信息
        const hasMarginWarning = result.reason.some(r => r.includes('毛利'));
        expect(hasMarginWarning).toBe(true);
    });

    test('should block negative margin (Hard Stop)', () => {
        const result = checkDiscountRisk(
            mockItems,
            190, // Final: 190 < Cost: 200
            400,
            mockSettings
        );
        expect(result.isRisk).toBe(true);
        expect(result.hardStop).toBe(true);
        expect(result.reason[0]).toContain('负毛利严重风险');
    });
});
