import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../logic/order-state-machine';

describe('OrderStateMachine', () => {
    describe('validateTransition', () => {
        it('should allow self-transition', () => {
            expect(OrderStateMachine.validateTransition('DRAFT', 'DRAFT')).toBe(true);
            expect(OrderStateMachine.validateTransition('SIGNED', 'SIGNED')).toBe(true);
        });

        it('should allow valid transitions', () => {
            // DRAFT -> PENDING_MEASURE
            expect(OrderStateMachine.validateTransition('DRAFT', 'PENDING_MEASURE')).toBe(true);
            // SIGNED -> PAID
            expect(OrderStateMachine.validateTransition('SIGNED', 'PAID')).toBe(true);
            // PENDING_INSTALL -> INSTALLATION_COMPLETED
            expect(OrderStateMachine.validateTransition('PENDING_INSTALL', 'INSTALLATION_COMPLETED')).toBe(true);
            // HALTED -> IN_PRODUCTION
            expect(OrderStateMachine.validateTransition('HALTED', 'IN_PRODUCTION')).toBe(true);
        });

        it('should deny invalid transitions', () => {
            // DRAFT -> PAID (skip steps)
            expect(OrderStateMachine.validateTransition('DRAFT', 'PAID')).toBe(false);
            // COMPLETED -> DRAFT (backward)
            expect(OrderStateMachine.validateTransition('COMPLETED', 'DRAFT')).toBe(false);
            // CANCELLED -> SIGNED (revive)
            expect(OrderStateMachine.validateTransition('CANCELLED', 'SIGNED')).toBe(false);
        });

        it('should allow cancellation from most states', () => {
            expect(OrderStateMachine.validateTransition('DRAFT', 'CANCELLED')).toBe(true);
            expect(OrderStateMachine.validateTransition('SIGNED', 'CANCELLED')).toBe(true);
            expect(OrderStateMachine.validateTransition('IN_PRODUCTION', 'CANCELLED')).toBe(true);
        });
    });

    describe('getNextStates', () => {
        it('should return correct next states for DRAFT', () => {
            const next = OrderStateMachine.getNextStates('DRAFT');
            expect(next).toContain('PENDING_MEASURE');
            expect(next).toContain('CANCELLED');
        });

        it('should return empty array for final states', () => {
            expect(OrderStateMachine.getNextStates('COMPLETED')).toEqual([]);
            expect(OrderStateMachine.getNextStates('CANCELLED')).toEqual([]);
            expect(OrderStateMachine.getNextStates('PAUSED')).toEqual([]);
        });

        it('should return correct next states for HALTED', () => {
            const next = OrderStateMachine.getNextStates('HALTED');
            expect(next).toContain('IN_PRODUCTION');
            expect(next).toContain('PENDING_PRODUCTION');
            expect(next).toContain('CANCELLED');
        });
    });

    describe('canCancel', () => {
        it('should return true for active states', () => {
            expect(OrderStateMachine.canCancel('DRAFT')).toBe(true);
            expect(OrderStateMachine.canCancel('SIGNED')).toBe(true);
            expect(OrderStateMachine.canCancel('IN_PRODUCTION')).toBe(true);
        });

        it('should return false for final states', () => {
            expect(OrderStateMachine.canCancel('COMPLETED')).toBe(false);
            expect(OrderStateMachine.canCancel('CANCELLED')).toBe(false);
        });
    });
});
