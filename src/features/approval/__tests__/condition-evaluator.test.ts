import { describe, it, expect } from 'vitest';
import { evaluateConditions, Condition } from '../utils/condition-evaluator';

describe('Condition Evaluator (evaluateConditions)', () => {

    it('should return true if conditions array is empty, null, or undefined', () => {
        expect(evaluateConditions([], { amount: 100 })).toBe(true);
        expect(evaluateConditions(null as unknown as Condition[], { amount: 100 })).toBe(true);
        expect(evaluateConditions(undefined as unknown as Condition[], { amount: 100 })).toBe(true);
    });

    it('should evaluate equality (eq)', () => {
        const conditions: Condition[] = [{ field: 'department', operator: 'eq', value: 'IT' }];
        expect(evaluateConditions(conditions, { department: 'IT' })).toBe(true);
        expect(evaluateConditions(conditions, { department: 'HR' })).toBe(false);
        // Missing property
        expect(evaluateConditions(conditions, { otherField: 'IT' })).toBe(false);
    });

    it('should evaluate inequality (ne)', () => {
        const conditions: Condition[] = [{ field: 'status', operator: 'ne', value: 'REJECTED' }];
        expect(evaluateConditions(conditions, { status: 'APPROVED' })).toBe(true);
        expect(evaluateConditions(conditions, { status: 'REJECTED' })).toBe(false);
    });

    it('should evaluate strictly greater than (gt)', () => {
        const conditions: Condition[] = [{ field: 'amount', operator: 'gt', value: 1000 }];
        expect(evaluateConditions(conditions, { amount: 1500 })).toBe(true);
        expect(evaluateConditions(conditions, { amount: 1000 })).toBe(false);
        expect(evaluateConditions(conditions, { amount: 500 })).toBe(false);
        // Type coercion logic check
        expect(evaluateConditions(conditions, { amount: '2000' })).toBe(true);
    });

    it('should evaluate strictly less than (lt)', () => {
        const conditions: Condition[] = [{ field: 'discount', operator: 'lt', value: 50 }];
        expect(evaluateConditions(conditions, { discount: 20 })).toBe(true);
        expect(evaluateConditions(conditions, { discount: 50 })).toBe(false);
        expect(evaluateConditions(conditions, { discount: 100 })).toBe(false);
    });

    it('should evaluate inclusion (in)', () => {
        const conditions: Condition[] = [{ field: 'category', operator: 'in', value: ['A', 'B', 'C'] }];
        expect(evaluateConditions(conditions, { category: 'B' })).toBe(true);
        expect(evaluateConditions(conditions, { category: 'D' })).toBe(false);
    });

    it('should return false when a field is missing in payload for standard operators', () => {
        const conditions: Condition[] = [{ field: 'priority', operator: 'eq', value: 'high' }];
        expect(evaluateConditions(conditions, {})).toBe(false);
    });

    it('should return true if operator is completely unknown/default', () => {
        // Technically unknown operators default to true based on the switch statement default case
        const conditions: Condition[] = [{ field: 'region', operator: 'unknown_op', value: 'US' }];
        expect(evaluateConditions(conditions, { region: 'EU' })).toBe(true);
    });

    it('should evaluate multiple conditions with logical AND behavior', () => {
        const conditions: Condition[] = [
            { field: 'amount', operator: 'gt', value: 1000 },
            { field: 'department', operator: 'eq', value: 'SALES' }
        ];

        // All passing
        expect(evaluateConditions(conditions, { amount: 5000, department: 'SALES' })).toBe(true);

        // One failing
        expect(evaluateConditions(conditions, { amount: 500, department: 'SALES' })).toBe(false);
        expect(evaluateConditions(conditions, { amount: 5000, department: 'IT' })).toBe(false);

        // All failing
        expect(evaluateConditions(conditions, { amount: 500, department: 'IT' })).toBe(false);
    });

});
