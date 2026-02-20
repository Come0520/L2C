/**
 * PO Lifecycle 集成测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
// import { createApFromPoInternal } from '@/features/finance/actions/ap'; // 暂时移除，直到集成实现

// Mock Modules
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    requirePermission: vi.fn(),
    checkPermission: vi.fn().mockReturnValue(true),
}));

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            purchaseOrders: {
                findFirst: vi.fn(),
                findMany: vi.fn().mockResolvedValue([])
            },
            suppliers: {
                findFirst: vi.fn(),
            },
            products: {
                findFirst: vi.fn()
            }
        },
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-po-id', poNo: 'PO-123', status: 'DRAFT' }])
            })
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ id: 'updated-po-id' }])
            })
        }),
        transaction: vi.fn().mockImplementation(async (callback) => {
            // Mock transaction context
            const transactionContext = {
                query: {
                    purchaseOrders: {
                        findFirst: vi.fn(),
                        findMany: vi.fn().mockResolvedValue([])
                    },
                    suppliers: { findFirst: vi.fn().mockResolvedValue({ name: 'Supplier' }) },
                    products: { findFirst: vi.fn().mockResolvedValue({ id: 'prod-1', name: 'Product 1' }) }
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'new-po-id', poNo: 'PO-123', status: 'DRAFT' }])
                    })
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([{ id: 'updated-po-id' }])
                    })
                }),
            };
            return await callback(transactionContext);
        })
    },
}));

vi.mock('@/shared/api/schema', () => ({
    purchaseOrders: { id: 'purchaseOrders.id', poNo: 'purchaseOrders.poNo', status: 'purchaseOrders.status', orderId: 'purchaseOrders.orderId', tenantId: 'purchaseOrders.tenantId' },
    purchaseOrderItems: { id: 'purchaseOrderItems.id' },
    suppliers: { id: 'suppliers.id' },
    orders: { id: 'orders.id' },
    products: { id: 'products.id' },
    inventoryLogs: { id: 'inventoryLogs.id' },
    systemLogs: { id: 'system_logs.id' },
}));

vi.mock('@/features/finance', () => ({
    createApFromPoInternal: vi.fn().mockResolvedValue({ success: true, id: 'new-ap-id' }),
}));

// Imports
import { createPurchaseOrder, updatePoStatus } from '../actions';

describe('PO Lifecycle', () => {
    const mockSession = {
        user: { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
    });

    it('should create a PO in DRAFT status', async () => {
        const input = {
            supplierId: '123e4567-e89b-12d3-a456-426614174001',
            orderId: '123e4567-e89b-12d3-a456-426614174002',
            items: [
                { productId: 'prod-1', quantity: 10, unitCost: 100 }
            ]
        };

        // Mock Supplier check
        const mockFindFirst = db.query.suppliers.findFirst as unknown as import('vitest').Mock;
        mockFindFirst.mockResolvedValue({
            id: '123e4567-e89b-12d3-a456-426614174001',
            tenantId: 'test-tenant-id',
            supplierNo: 'SUP001',
            name: 'Supplier',
            isActive: true,
        });

        const result = await createPurchaseOrder(input);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id', 'new-po-id');
    });

    it('should update PO status', async () => {
        const poId = 'po-123';

        // Mock PO lookup for status machine
        const mockFindFirst = db.query.purchaseOrders.findFirst as unknown as import('vitest').Mock;
        mockFindFirst.mockResolvedValueOnce({
            id: poId,
            status: 'DRAFT',
            supplierId: 'sup-1',
            tenantId: 'test-tenant-id'
        });

        // DRAFT -> PENDING_CONFIRMATION is valid
        const result = await updatePoStatus({ poId, status: 'PENDING_CONFIRMATION' });

        if (!result.success) {
            console.error('updatePoStatus failed:', result.error);
        }
        expect(result.success).toBe(true);
        expect(db.update).toHaveBeenCalled();
    });

    it('should fail if invalid status transition', async () => {
        const poId = 'po-123';

        // Mock PO lookup
        const mockFindFirst = db.query.purchaseOrders.findFirst as unknown as import('vitest').Mock;
        mockFindFirst.mockResolvedValueOnce({
            id: poId,
            status: 'DRAFT',
            tenantId: 'test-tenant-id'
        });

        // DRAFT -> COMPLETED is NOT valid
        const result = await updatePoStatus({ poId, status: 'COMPLETED' });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/状态不允许/);
    });
});
