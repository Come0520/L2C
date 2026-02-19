import { describe, it, expect } from 'vitest';
import { isValidTransition, getAvailableTransitions, isTerminalState, VALID_STATE_TRANSITIONS } from '../logic/state-machine';

describe('After-Sales State Machine', () => {
    describe('isValidTransition', () => {
        it('should allow valid transitions from PENDING', () => {
            expect(isValidTransition('PENDING', 'INVESTIGATING')).toBe(true);
            expect(isValidTransition('PENDING', 'PROCESSING')).toBe(true);
            expect(isValidTransition('PENDING', 'REJECTED')).toBe(true);
        });

        it('should allow valid transitions from INVESTIGATING', () => {
            expect(isValidTransition('INVESTIGATING', 'PROCESSING')).toBe(true);
            expect(isValidTransition('INVESTIGATING', 'PENDING_VISIT')).toBe(true);
            expect(isValidTransition('INVESTIGATING', 'REJECTED')).toBe(true);
        });

        it('should allow valid transitions from PROCESSING', () => {
            expect(isValidTransition('PROCESSING', 'PENDING_VERIFY')).toBe(true);
            expect(isValidTransition('PROCESSING', 'CLOSED')).toBe(true);
        });

        it('should not allow invalid transitions', () => {
            expect(isValidTransition('PENDING', 'CLOSED')).toBe(false);
            expect(isValidTransition('CLOSED', 'PROCESSING')).toBe(false);
            expect(isValidTransition('REJECTED', 'PENDING')).toBe(false);
        });

        it('should return false for unknown states', () => {
            expect(isValidTransition('UNKNOWN', 'PENDING')).toBe(false);
            expect(isValidTransition('PENDING', 'UNKNOWN')).toBe(false);
        });
    });

    describe('getAvailableTransitions', () => {
        it('should return correct targets for PENDING', () => {
            const targets = getAvailableTransitions('PENDING');
            expect(targets).toContain('INVESTIGATING');
            expect(targets).toContain('PROCESSING');
            expect(targets).toContain('REJECTED');
            expect(targets.length).toBe(3);
        });

        it('should return empty array for terminal states', () => {
            expect(getAvailableTransitions('CLOSED')).toEqual([]);
            expect(getAvailableTransitions('REJECTED')).toEqual([]);
        });
    });

    describe('isTerminalState', () => {
        it('should identify CLOSED and REJECTED as terminal', () => {
            expect(isTerminalState('CLOSED')).toBe(true);
            expect(isTerminalState('REJECTED')).toBe(true);
        });

        it('should not identify other states as terminal', () => {
            expect(isTerminalState('PENDING')).toBe(false);
            expect(isTerminalState('PROCESSING')).toBe(false);
            expect(isTerminalState('INVESTIGATING')).toBe(false);
        });
    });

    describe('Data Integrity', () => {
        it('should have all defined targets as keys (except terminal ones)', () => {
            const allStates = new Set(Object.keys(VALID_STATE_TRANSITIONS));
            Object.values(VALID_STATE_TRANSITIONS).flat().forEach(target => {
                expect(allStates.has(target)).toBe(true);
            });
        });
    });
});
