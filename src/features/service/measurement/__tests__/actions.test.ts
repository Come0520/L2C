import { describe, it, expect } from 'vitest';
import { measureItemSchema, createMeasureTaskSchema } from '../schemas';

describe('Measurement Actions', () => {
    it('should pass placeholder test', () => {
        expect(true).toBe(true);
    });
});

describe('Measurement Zod Schemas', () => {
    it('should validate a valid measure item', () => {
        const validItem = {
            roomName: '客厅',
            windowType: 'STRAIGHT',
            width: 3000,
            height: 2600,
            installType: 'TOP',
            wallMaterial: 'CONCRETE',
        };
        const result = measureItemSchema.safeParse(validItem);
        expect(result.success).toBe(true);
    });

    it('should fail on invalid width', () => {
        const invalidItem = {
            roomName: '客厅',
            windowType: 'STRAIGHT',
            width: -100, // Invalid
            height: 2600,
        };
        const result = measureItemSchema.safeParse(invalidItem);
        expect(result.success).toBe(false);
    });

    it('should validate create task schema', () => {
        const validTask = {
            leadId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '550e8400-e29b-41d4-a716-446655440001',
            scheduledAt: new Date().toISOString(),
        };
        const result = createMeasureTaskSchema.safeParse(validTask);
        expect(result.success).toBe(true);
    });
});
