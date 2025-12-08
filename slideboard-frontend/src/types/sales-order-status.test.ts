import { describe, it, expect } from 'vitest';

import {
    SalesOrderStatus,
    canTransitionTo,
    getStatusTransitionPath,
    STATUS_METADATA,
    StatusCategory
} from './sales-order-status';

describe('Sales Order Status Logic', () => {
    describe('Status Metadata', () => {
        it('should have metadata for all statuses', () => {
            Object.values(SalesOrderStatus).forEach(status => {
                expect(STATUS_METADATA[status]).toBeDefined();
                expect(STATUS_METADATA[status].name).toBeDefined();
                expect(STATUS_METADATA[status].category).toBeDefined();
            });
        });

        it('should have correct category assignments', () => {
            expect(STATUS_METADATA[SalesOrderStatus.PENDING_ASSIGNMENT].category).toBe(StatusCategory.LEAD);
            expect(STATUS_METADATA[SalesOrderStatus.PENDING_MEASUREMENT].category).toBe(StatusCategory.ORDER);
            expect(STATUS_METADATA[SalesOrderStatus.PENDING_PUSH].category).toBe(StatusCategory.ORDER);
            expect(STATUS_METADATA[SalesOrderStatus.PENDING_RECONCILIATION].category).toBe(StatusCategory.FINANCE);
        });
    });

    describe('State Transitions', () => {
        it('should allow valid transitions', () => {
            // Lead flow
            expect(canTransitionTo(SalesOrderStatus.PENDING_ASSIGNMENT, SalesOrderStatus.PENDING_FOLLOW_UP)).toBe(true);
            expect(canTransitionTo(SalesOrderStatus.PENDING_FOLLOW_UP, SalesOrderStatus.FOLLOWING_UP)).toBe(true);

            // Measurement flow
            expect(canTransitionTo(SalesOrderStatus.PENDING_MEASUREMENT, SalesOrderStatus.MEASURING_PENDING_ASSIGNMENT)).toBe(true);

            // Order flow
            expect(canTransitionTo(SalesOrderStatus.PENDING_PUSH, SalesOrderStatus.PENDING_ORDER)).toBe(true);
        });

        it('should prevent invalid transitions', () => {
            // Cannot jump from Lead start to Order finish
            expect(canTransitionTo(SalesOrderStatus.PENDING_ASSIGNMENT, SalesOrderStatus.COMPLETED)).toBe(false);

            // Cannot go backwards usually (unless specific rules exist)
            expect(canTransitionTo(SalesOrderStatus.COMPLETED, SalesOrderStatus.PENDING_ASSIGNMENT)).toBe(false);
        });

        it('should allow transition to exception states from most states', () => {
            expect(canTransitionTo(SalesOrderStatus.FOLLOWING_UP, SalesOrderStatus.CANCELLED)).toBe(true);
            expect(canTransitionTo(SalesOrderStatus.PENDING_MEASUREMENT, SalesOrderStatus.SUSPENDED)).toBe(true);
        });

        describe('SUSPENDED State Transitions', () => {
            it('should allow transition to SUSPENDED from all normal states', () => {
                // Lead stage
                expect(canTransitionTo(SalesOrderStatus.PENDING_ASSIGNMENT, SalesOrderStatus.SUSPENDED)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.FOLLOWING_UP, SalesOrderStatus.SUSPENDED)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.DRAFT_SIGNED, SalesOrderStatus.SUSPENDED)).toBe(true);

                // Order stage
                expect(canTransitionTo(SalesOrderStatus.PENDING_MEASUREMENT, SalesOrderStatus.SUSPENDED)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.IN_PRODUCTION, SalesOrderStatus.SUSPENDED)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.INSTALLING_PENDING_VISIT, SalesOrderStatus.SUSPENDED)).toBe(true);

                // Finance stage
                expect(canTransitionTo(SalesOrderStatus.PENDING_INVOICE, SalesOrderStatus.SUSPENDED)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.PENDING_PAYMENT, SalesOrderStatus.SUSPENDED)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.COMPLETED, SalesOrderStatus.SUSPENDED)).toBe(true);
            });

            it('should allow transition from SUSPENDED to various states', () => {
                // Lead stage recovery
                expect(canTransitionTo(SalesOrderStatus.SUSPENDED, SalesOrderStatus.FOLLOWING_UP)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.SUSPENDED, SalesOrderStatus.DRAFT_SIGNED)).toBe(true);

                // Order stage recovery
                expect(canTransitionTo(SalesOrderStatus.SUSPENDED, SalesOrderStatus.PENDING_MEASUREMENT)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.SUSPENDED, SalesOrderStatus.IN_PRODUCTION)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.SUSPENDED, SalesOrderStatus.INSTALLING_PENDING_ASSIGNMENT)).toBe(true);

                // Finance stage recovery
                expect(canTransitionTo(SalesOrderStatus.SUSPENDED, SalesOrderStatus.PENDING_INVOICE)).toBe(true);
                expect(canTransitionTo(SalesOrderStatus.SUSPENDED, SalesOrderStatus.COMPLETED)).toBe(true);

                // Exception states
                expect(canTransitionTo(SalesOrderStatus.SUSPENDED, SalesOrderStatus.CANCELLED)).toBe(true);
            });

            it('should have correct metadata for SUSPENDED state', () => {
                expect(STATUS_METADATA[SalesOrderStatus.SUSPENDED]).toBeDefined();
                expect(STATUS_METADATA[SalesOrderStatus.SUSPENDED].category).toBe(StatusCategory.EXCEPTION);
                expect(STATUS_METADATA[SalesOrderStatus.SUSPENDED].name).toBe('暂停');
                expect(STATUS_METADATA[SalesOrderStatus.SUSPENDED].nextStatuses.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Path Finding', () => {
        it('should find path between connected statuses', () => {
            const path = getStatusTransitionPath(SalesOrderStatus.PENDING_ASSIGNMENT, SalesOrderStatus.FOLLOWING_UP);
            expect(path).toEqual([
                SalesOrderStatus.PENDING_ASSIGNMENT,
                SalesOrderStatus.PENDING_FOLLOW_UP,
                SalesOrderStatus.FOLLOWING_UP
            ]);
        });
    });

    it('should return null for truly unreachable path', () => {
        // 选择一个真正无法到达的路径，比如从取消状态到正常状态
        const path = getStatusTransitionPath(SalesOrderStatus.CANCELLED, SalesOrderStatus.PENDING_ASSIGNMENT);
        expect(path).toBeNull();
    });
});
