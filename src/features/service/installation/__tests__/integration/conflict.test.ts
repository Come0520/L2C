import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSchedulingConflict } from '../../logic/conflict-detection';
import { checkLogisticsReady } from '../../logic/logistics-check';

// Mock the DB module
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            installTasks: {
                findMany: vi.fn(),
            },
            purchaseOrders: {
                findMany: vi.fn(),
            }
        }
    }
}));

import { db } from '@/shared/api/db';

describe('Installation Logic Unit Tests', () => {
    const installerId = 'installer-123';
    const orderId = 'order-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Conflict Detection', () => {
        it('should detect HARD conflict', async () => {
            // Mock existing tasks
            (db.query.installTasks.findMany as any).mockResolvedValue([
                {
                    id: 'task-1',
                    taskNo: 'T1',
                    scheduledTimeSlot: '14:00-16:00',
                    scheduledDate: new Date('2026-05-20')
                }
            ]);

            const result = await checkSchedulingConflict(
                installerId,
                new Date('2026-05-20'),
                '14:00-16:00'
            );

            expect(result.hasConflict).toBe(true);
            expect(result.conflictType).toBe('HARD');
        });

        it('should pass if no conflict', async () => {
            (db.query.installTasks.findMany as any).mockResolvedValue([]);

            const result = await checkSchedulingConflict(
                installerId,
                new Date('2026-05-20'),
                '14:00-16:00'
            );

            expect(result.hasConflict).toBe(false);
        });
    });

    describe('Logistics Check', () => {
        it('should fail if PO is not ready', async () => {
            (db.query.purchaseOrders.findMany as any).mockResolvedValue([
                { id: 'po-1', poNo: 'PO1', status: 'RECEIVED' },
                { id: 'po-2', poNo: 'PO2', status: 'DRAFT' } // Not ready
            ]);

            const result = await checkLogisticsReady(orderId);
            expect(result.ready).toBe(false);
            expect(result.message).toContain('PO2');
        });

        it('should pass if all POs are ready', async () => {
            (db.query.purchaseOrders.findMany as any).mockResolvedValue([
                { id: 'po-1', poNo: 'PO1', status: 'RECEIVED' },
                { id: 'po-2', poNo: 'PO2', status: 'ARRIVED' }
            ]);

            const result = await checkLogisticsReady(orderId);
            expect(result.ready).toBe(true);
        });
    });
});
