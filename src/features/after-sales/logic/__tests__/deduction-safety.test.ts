import { describe, it, expect, vi } from 'vitest';
import { checkMultipleDeductionsAllowed } from '../deduction-safety';

describe('deduction-safety batch checks', () => {
    it('should be defined', () => {
        expect(checkMultipleDeductionsAllowed).toBeDefined();
    });
});
