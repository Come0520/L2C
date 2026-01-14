
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshOrderStatus } from '../actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import type { MockAuth, MockOrder } from '@/shared/types/mocks';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: {
                findFirst: vi.fn()
            }
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn()
            }))
        }))
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn()
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

describe('refreshOrderStatus', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as MockAuth).mockResolvedValue({ user: { tenantId: 't1' } });
    });

    it('should stay PENDING_PO if no POs exist (even if prioritized logic implies otherwise)', async () => {
        const mockOrder: MockOrder = {
            id: 'o1',
            status: 'PENDING_PO',
            purchaseOrders: [],
            installTasks: [],
            tenantId: 't1',
            orderNo: 'ORD-001'
        };
        (db.query.orders.findFirst as typeof vi.fn).mockResolvedValue(mockOrder);

        // Execute
        const result = await refreshOrderStatus('o1');

        // Verify
        expect(result.status).toBe('PENDING_PO');
        expect(db.update).not.toHaveBeenCalled();
    });

    // --- Supply Chain Barrier Tests ---

    it('should promote to IN_PRODUCTION if any PO is ORDERED', async () => {
        const mockOrder: MockOrder = {
            id: 'o1',
            status: 'PENDING_PO',
            purchaseOrders: [
                { id: 'p1', status: 'DRAFT' },
                { id: 'p2', status: 'ORDERED' } // Trigger
            ],
            installTasks: [],
            tenantId: 't1',
            orderNo: 'ORD-001'
        };
        (db.query.orders.findFirst as typeof vi.fn).mockResolvedValue(mockOrder);

        const result = await refreshOrderStatus('o1');

        expect(result.newStatus).toBe('IN_PRODUCTION');
        expect(db.update).toHaveBeenCalled();
    });

    it('should promote to PENDING_DELIVERY only when ALL POs are RECEIVED or COMPLETED', async () => {
        const mockOrder1: MockOrder = {
            id: 'o1',
            status: 'IN_PRODUCTION',
            purchaseOrders: [
                { id: 'p1', status: 'RECEIVED' },
                { id: 'p2', status: 'SHIPPED' } // Not ready
            ],
            installTasks: [],
            tenantId: 't1',
            orderNo: 'ORD-001'
        };
        (db.query.orders.findFirst as typeof vi.fn).mockResolvedValueOnce(mockOrder1);

        let result = await refreshOrderStatus('o1');
        expect(result.status).toBe('IN_PRODUCTION'); // Unchanged

        // Case 2: All Ready -> Promote
        const mockOrder2: MockOrder = {
            id: 'o1',
            status: 'IN_PRODUCTION',
            purchaseOrders: [
                { id: 'p1', status: 'RECEIVED' },
                { id: 'p2', status: 'COMPLETED' }
            ],
            installTasks: [],
            tenantId: 't1',
            orderNo: 'ORD-001'
        };
        (db.query.orders.findFirst as typeof vi.fn).mockResolvedValueOnce(mockOrder2);

        result = await refreshOrderStatus('o1');
        expect(result.newStatus).toBe('PENDING_DELIVERY');
    });

    // --- Service Delivery Barrier Tests ---

    it('should stay SHIPPED/PENDING_INSTALL if tasks exist but not started', async () => {
        (db.query.orders.findFirst as typeof vi.fn).mockResolvedValue({
            id: 'o1',
            status: 'SHIPPED',
            purchaseOrders: [{ status: 'COMPLETED' }], // POs done
            installTasks: [
                { id: 't1', status: 'PENDING_DISPATCH' } // Not started
            ]
        });

        const result = await refreshOrderStatus('o1');

        // Logic says: if at SHIPPED and tasks exist, maintain PENDING_INSTALL (or transition to it)
        expect(result.newStatus).toBe('PENDING_INSTALL');
    });

    it('should stay PENDING_INSTALL if any task is installing', async () => {
        (db.query.orders.findFirst as typeof vi.fn).mockResolvedValue({
            id: 'o1',
            status: 'PENDING_INSTALL',
            purchaseOrders: [{ status: 'COMPLETED' }],
            installTasks: [
                { id: 't1', status: 'COMPLETED' },
                { id: 't2', status: 'DISPATCHING' } // In progress
            ]
        });

        const result = await refreshOrderStatus('o1');
        expect(result.status).toBe('PENDING_INSTALL'); // Unchanged
    });

    it('should promote to COMPLETED only when ALL tasks are COMPLETED', async () => {
        (db.query.orders.findFirst as typeof vi.fn).mockResolvedValue({
            id: 'o1',
            status: 'PENDING_INSTALL',
            purchaseOrders: [{ status: 'COMPLETED' }],
            installTasks: [
                { id: 't1', status: 'COMPLETED' },
                { id: 't2', status: 'COMPLETED' }
            ]
        });

        const result = await refreshOrderStatus('o1');
        expect(result.newStatus).toBe('COMPLETED');
    });
});
