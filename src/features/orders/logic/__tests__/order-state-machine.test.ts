import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../order-state-machine';

describe('OrderStateMachine', () => {
    describe('validateTransition', () => {
        it('should allow self-transition', () => {
            expect(OrderStateMachine.validateTransition('DRAFT', 'DRAFT')).toBe(true);
        });

        it('should allow valid transitions', () => {
            const validTransitions = [
                ['DRAFT', 'PENDING_MEASURE'],
                ['PENDING_MEASURE', 'MEASURED'],
                ['MEASURED', 'QUOTED'],
                ['QUOTED', 'SIGNED'],
                ['SIGNED', 'PAID'],
                ['PAID', 'PENDING_PRODUCTION'],
                ['PENDING_PRODUCTION', 'IN_PRODUCTION'],
                ['IN_PRODUCTION', 'PENDING_DELIVERY'],
                ['PENDING_DELIVERY', 'PENDING_INSTALL'],
                ['PENDING_INSTALL', 'INSTALLATION_COMPLETED'],
                ['INSTALLATION_COMPLETED', 'PENDING_CONFIRMATION'],
                ['PENDING_CONFIRMATION', 'COMPLETED'],
            ] as const;

            validTransitions.forEach(([from, to]) => {
                expect(OrderStateMachine.validateTransition(from, to)).toBe(true);
            });
        });

        it('should reject invalid transitions', () => {
            const invalidTransitions = [
                ['DRAFT', 'COMPLETED'],
                ['PENDING_MEASURE', 'SIGNED'],
                ['COMPLETED', 'DRAFT'],
            ] as const;

            invalidTransitions.forEach(([from, to]) => {
                expect(OrderStateMachine.validateTransition(from, to)).toBe(false);
            });
        });

        it('should allow cancellation from most states', () => {
            const cancellableStates = ['DRAFT', 'PENDING_MEASURE', 'SIGNED', 'IN_PRODUCTION'];
            cancellableStates.forEach(state => {
                expect(OrderStateMachine.validateTransition(state as any, 'CANCELLED')).toBe(true);
            });
        });

        it('should allow HALTED from specific states', () => {
            const haltableStates = [
                'SIGNED', 'PAID', 'PENDING_PO',
                'PENDING_PRODUCTION', 'IN_PRODUCTION',
                'PENDING_DELIVERY', 'PENDING_INSTALL'
            ];

            haltableStates.forEach(state => {
                expect(OrderStateMachine.validateTransition(state as any, 'HALTED')).toBe(true);
            });
        });

        it('should recover from HALTED to production states', () => {
            expect(OrderStateMachine.validateTransition('HALTED', 'PENDING_PRODUCTION')).toBe(true);
            expect(OrderStateMachine.validateTransition('HALTED', 'IN_PRODUCTION')).toBe(true);
        });

        it('should not recover from HALTED to arbitrary states', () => {
            expect(OrderStateMachine.validateTransition('HALTED', 'DRAFT')).toBe(false);
            expect(OrderStateMachine.validateTransition('HALTED', 'COMPLETED')).toBe(false);
        });
    });

    describe('getNextStates', () => {
        it('should return correct next states', () => {
            expect(OrderStateMachine.getNextStates('DRAFT')).toContain('PENDING_MEASURE');
            expect(OrderStateMachine.getNextStates('COMPLETED')).toEqual([]);
        });
    });

    describe('canCancel', () => {
        it('should return true for non-terminal states', () => {
            expect(OrderStateMachine.canCancel('DRAFT')).toBe(true);
            expect(OrderStateMachine.canCancel('IN_PRODUCTION')).toBe(true);
        });

        it('should return false for terminal states', () => {
            expect(OrderStateMachine.canCancel('COMPLETED')).toBe(false);
            expect(OrderStateMachine.canCancel('CANCELLED')).toBe(false);
        });
    });
});
