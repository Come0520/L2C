import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQualityAnalyticsSchema } from '../schemas';

describe('After-Sales Analytics Schema', () => {
    it('should reject date range exceeding 365 days', () => {
        // RED: Schema does not yet have this validation
        const result = getQualityAnalyticsSchema.safeParse({
            startDate: '2023-01-01',
            endDate: '2025-01-01', // > 365 days
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('时间跨度不能超过365天');
        }
    });

    it('should accept date range within 365 days', () => {
        const result = getQualityAnalyticsSchema.safeParse({
            startDate: '2024-01-01',
            endDate: '2024-12-31', // < 365 days
        });

        expect(result.success).toBe(true);
    });
});
