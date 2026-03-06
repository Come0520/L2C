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
      expect(
        OrderStateMachine.validateTransition('PENDING_INSTALL', 'INSTALLATION_COMPLETED')
      ).toBe(true);
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

    it('PAUSED（废弃终态）应不可取消', () => {
      // PAUSED 是废弃状态，仍保留在枚举中，但逻辑上是终态
      expect(OrderStateMachine.canCancel('PAUSED')).toBe(false);
    });

    it('HALTED 叫停状态应允许取消', () => {
      expect(OrderStateMachine.canCancel('HALTED')).toBe(true);
    });

    it('PENDING_APPROVAL 审批中状态应允许取消', () => {
      expect(OrderStateMachine.canCancel('PENDING_APPROVAL')).toBe(true);
    });
  });

  describe('validateTransition — 边缘场景', () => {
    it('PAUSED（废弃终态）不能流转到任何状态', () => {
      expect(OrderStateMachine.validateTransition('PAUSED', 'DRAFT')).toBe(false);
      expect(OrderStateMachine.validateTransition('PAUSED', 'IN_PRODUCTION')).toBe(false);
      expect(OrderStateMachine.validateTransition('PAUSED', 'CANCELLED')).toBe(false);
    });

    it('PAUSED 自转换（同态）应允许（保持不变）', () => {
      expect(OrderStateMachine.validateTransition('PAUSED', 'PAUSED')).toBe(true);
    });

    it('PENDING_APPROVAL 审批通过后可进入生产', () => {
      expect(OrderStateMachine.validateTransition('PENDING_APPROVAL', 'PENDING_PRODUCTION')).toBe(
        true
      );
    });

    it('PENDING_APPROVAL 可以取消', () => {
      expect(OrderStateMachine.validateTransition('PENDING_APPROVAL', 'CANCELLED')).toBe(true);
    });

    it('PENDING_APPROVAL 不可跳转到完成', () => {
      expect(OrderStateMachine.validateTransition('PENDING_APPROVAL', 'COMPLETED')).toBe(false);
    });

    it('INSTALLATION_REJECTED 可重新进入安装环节', () => {
      expect(OrderStateMachine.validateTransition('INSTALLATION_REJECTED', 'PENDING_INSTALL')).toBe(
        true
      );
    });

    it('INSTALLATION_REJECTED 不可直接完成', () => {
      expect(OrderStateMachine.validateTransition('INSTALLATION_REJECTED', 'COMPLETED')).toBe(
        false
      );
    });

    it('QUOTED 可退回草稿（客户要求重新报价）', () => {
      expect(OrderStateMachine.validateTransition('QUOTED', 'DRAFT')).toBe(true);
    });

    it('SIGNED 不可退回到报价阶段', () => {
      expect(OrderStateMachine.validateTransition('SIGNED', 'QUOTED')).toBe(false);
    });
  });

  describe('getAutoTransition()', () => {
    it('INSTALLATION_COMPLETED 可自动流转到 COMPLETED（T+N 策略）', () => {
      expect(OrderStateMachine.getAutoTransition('INSTALLATION_COMPLETED')).toBe('COMPLETED');
    });

    it('PENDING_DELIVERY 无自动流转（需人工操作）', () => {
      expect(OrderStateMachine.getAutoTransition('PENDING_DELIVERY')).toBeNull();
    });

    it('其他普通状态无自动流转', () => {
      expect(OrderStateMachine.getAutoTransition('DRAFT')).toBeNull();
      expect(OrderStateMachine.getAutoTransition('SIGNED')).toBeNull();
      expect(OrderStateMachine.getAutoTransition('IN_PRODUCTION')).toBeNull();
      expect(OrderStateMachine.getAutoTransition('HALTED')).toBeNull();
      expect(OrderStateMachine.getAutoTransition('CANCELLED')).toBeNull();
    });
  });

  describe('getNextStates — 边缘场景', () => {
    it('PENDING_APPROVAL 的合法后续状态', () => {
      const next = OrderStateMachine.getNextStates('PENDING_APPROVAL');
      expect(next).toContain('PENDING_PRODUCTION');
      expect(next).toContain('CANCELLED');
      expect(next).not.toContain('COMPLETED');
    });

    it('INSTALLATION_REJECTED 可重返安装', () => {
      const next = OrderStateMachine.getNextStates('INSTALLATION_REJECTED');
      expect(next).toContain('PENDING_INSTALL');
    });

    it('PAUSED 为空（废弃终态）', () => {
      expect(OrderStateMachine.getNextStates('PAUSED')).toEqual([]);
    });
  });
});
