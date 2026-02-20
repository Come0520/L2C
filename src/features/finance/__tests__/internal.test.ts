import { describe, it, expect } from 'vitest';
import { financeInternal } from '../internal';

describe('financeInternal', () => {
    describe('calculateFees', () => {
        it('should return 0.6% for WECHAT', () => {
            expect(financeInternal.calculateFees(1000, 'WECHAT')).toBe(6);
        });

        it('should return 0.6% for ALIPAY', () => {
            expect(financeInternal.calculateFees(1000, 'ALIPAY')).toBe(6);
        });

        it('should return 0.35% for POS', () => {
            expect(financeInternal.calculateFees(1000, 'POS')).toBe(3.5);
        });

        it('should return 0 for BANK_TRANSFER', () => {
            expect(financeInternal.calculateFees(1000, 'BANK_TRANSFER')).toBe(0);
        });

        it('should return 0 for CASH', () => {
            expect(financeInternal.calculateFees(1000, 'CASH')).toBe(0);
        });

        it('should be case-insensitive for payment method', () => {
            expect(financeInternal.calculateFees(1000, 'wechat')).toBe(6);
        });

        it('should return 0 for unknown method', () => {
            expect(financeInternal.calculateFees(1000, 'UNKNOWN')).toBe(0);
        });

        it('should handle rounding with toFixed(2)', () => {
            // 123.45 * 0.006 = 0.7407 -> 0.74
            expect(financeInternal.calculateFees(123.45, 'WECHAT')).toBe(0.74);
        });
    });
});
