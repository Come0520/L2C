
import { describe, it, expect } from 'vitest';
import { OrderStateMachine, OrderStatus } from '../order-state-machine';

describe('Order State Machine', () => {

    describe('Valid Transitions (Happy Path)', () => {
        const validFlows: { from: OrderStatus, to: OrderStatus }[] = [
            { from: 'PENDING_PO', to: 'IN_PRODUCTION' },
            { from: 'IN_PRODUCTION', to: 'PENDING_DELIVERY' },
            { from: 'PENDING_DELIVERY', to: 'DISPATCHING' },
            { from: 'DISPATCHING', to: 'SHIPPED' },
            { from: 'SHIPPED', to: 'PENDING_INSTALL' },
            { from: 'PENDING_INSTALL', to: 'COMPLETED' },
            { from: 'COMPLETED', to: 'CLOSED' },
        ];

        validFlows.forEach(({ from, to }) => {
            it(`should allow transition from ${from} to ${to}`, () => {
                expect(OrderStateMachine.validateTransition(from, to)).toBe(true);
            });
        });
    });

    describe('Invalid Transitions', () => {
        it('should prevent skipping steps (PENDING_PO -> SHIPPED)', () => {
            expect(() => OrderStateMachine.validateTransition('PENDING_PO', 'SHIPPED')).toThrow('Invalid transition');
        });

        it('should prevent reversing steps (SHIPPED -> IN_PRODUCTION)', () => {
            expect(() => OrderStateMachine.validateTransition('SHIPPED', 'IN_PRODUCTION')).toThrow('Invalid transition');
        });

        it('should prevent modifying CLOSED orders', () => {
            expect(() => OrderStateMachine.validateTransition('CLOSED', 'COMPLETED')).toThrow('Invalid transition');
        });
    });

    describe('Cancellation Logic', () => {
        it('should allow cancellation from PENDING_PO', () => {
            expect(OrderStateMachine.canCancel('PENDING_PO')).toBe(true);
            expect(OrderStateMachine.validateTransition('PENDING_PO', 'CANCELLED')).toBe(true);
        });

        it('should allow cancellation from IN_PRODUCTION', () => {
            expect(OrderStateMachine.canCancel('IN_PRODUCTION')).toBe(true);
            expect(OrderStateMachine.validateTransition('IN_PRODUCTION', 'CANCELLED')).toBe(true);
        });

        it('should NOT allow cancellation from COMPLETED', () => {
            expect(OrderStateMachine.canCancel('COMPLETED')).toBe(false);
            expect(() => OrderStateMachine.validateTransition('COMPLETED', 'CANCELLED')).toThrow('Invalid transition');
        });

        it('should NOT allow cancellation from CLOSED', () => {
            expect(OrderStateMachine.canCancel('CLOSED')).toBe(false);
            expect(() => OrderStateMachine.validateTransition('CLOSED', 'CANCELLED')).toThrow('Invalid transition');
        });
    });
});
