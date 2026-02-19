
/**
 * @vitest-environment node
 */
import { vi, describe, it, expect, beforeAll } from 'vitest';
import { aggregateBundle } from '../logic/bundle-aggregator';

describe('Bundle Aggregation Logic', () => {
    it('should correctly sum up amounts from linked quotes', () => {
        const mockBundle = {
            id: 'bundle-1',
            quotes: [
                {
                    id: 'q1',
                    totalAmount: 1000,
                    discountAmount: 100,
                    finalAmount: 900,
                    status: 'DRAFT'
                },
                {
                    id: 'q2',
                    totalAmount: 2000,
                    discountAmount: 200,
                    finalAmount: 1800,
                    status: 'DRAFT'
                }
            ]
        };

        const result = aggregateBundle(mockBundle);

        // Expectation: The aggregator should sum up the amounts
        expect(result.totalAmount).toBe(3000);
        expect(result.discountAmount).toBe(300);
        expect(result.finalAmount).toBe(2700);
    });

    it('should handle bundles with no quotes', () => {
        const mockBundle = {
            id: 'bundle-empty',
            quotes: []
        };

        const result = aggregateBundle(mockBundle);

        expect(result.totalAmount).toBe(0);
        expect(result.discountAmount).toBe(0);
        expect(result.finalAmount).toBe(0);
    });
});
