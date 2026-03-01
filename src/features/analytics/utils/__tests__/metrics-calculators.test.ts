import { describe, it, expect } from 'vitest';
import {
    calculateConversionRate,
    calculateTrend,
    calculateGrossMargin
} from '../metrics-calculators';

describe('Analytics Metrics Calculators', () => {

    describe('calculateConversionRate', () => {
        it('should calculate valid conversion rate (分支1：正常数据)', () => {
            expect(calculateConversionRate(100, 25)).toBe('25.00');
            expect(calculateConversionRate(200, 100)).toBe('50.00');
        });

        it('should return null when fromCount is zero or negative (分支2：分母无效)', () => {
            expect(calculateConversionRate(0, 50)).toBeNull();
            expect(calculateConversionRate(-10, 5)).toBeNull();
        });

        it('should cap rate at 100% when toCount > fromCount (分支3：分子溢出)', () => {
            expect(calculateConversionRate(50, 60)).toBe('100.00');
        });
    });

    describe('calculateTrend', () => {
        it('should calculate positive trend correctly (分支1：正向增长)', () => {
            expect(calculateTrend(150, 100)).toBe('50.00');
        });

        it('should calculate negative trend correctly (分支2：负向增长)', () => {
            expect(calculateTrend(80, 100)).toBe('-20.00');
        });

        it('should return null if previous is zero or negative (分支3：无历史基准)', () => {
            expect(calculateTrend(100, 0)).toBeNull();
            expect(calculateTrend(100, -50)).toBeNull();
        });
    });

    describe('calculateGrossMargin', () => {
        it('should calculate profit and margin correctly (分支1：正常营收)', () => {
            const [profit, margin] = calculateGrossMargin(1000, 600);
            expect(profit).toBe('400.00');
            expect(margin).toBe('40.00');
        });

        it('should handle zero revenue (分支2：零营收处理)', () => {
            const [profit, margin] = calculateGrossMargin(0, 500);
            expect(profit).toBe('-500.00');
            expect(margin).toBe('0.00');
        });

        it('should handle negative revenue as fallback (分支3：负营收处理)', () => {
            const [profit, margin] = calculateGrossMargin(-100, 200);
            expect(profit).toBe('-300.00');
            expect(margin).toBe('0.00');
        });
    });

});
