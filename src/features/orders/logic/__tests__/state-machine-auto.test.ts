import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../order-state-machine';

describe('OrderStateMachine Auto-Transition', () => {
    it('INSTALLATION_COMPLETED 应自动流转至 COMPLETED', () => {
        const next = OrderStateMachine.getAutoTransition('INSTALLATION_COMPLETED');
        expect(next).toBe('COMPLETED');
    });

    it('PENDING_DELIVERY 目前暂无自动流转规则', () => {
        const next = OrderStateMachine.getAutoTransition('PENDING_DELIVERY');
        expect(next).toBeNull();
    });

    it('DRAFT 状态不应有自动流转', () => {
        const next = OrderStateMachine.getAutoTransition('DRAFT');
        expect(next).toBeNull();
    });

    it('验证 validateTransition 对自动流转目标的兼容性', () => {
        const current = 'INSTALLATION_COMPLETED';
        const autoNext = OrderStateMachine.getAutoTransition(current);
        if (autoNext) {
            expect(OrderStateMachine.validateTransition(current, autoNext)).toBe(true);
        }
    });
});
