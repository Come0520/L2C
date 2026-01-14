/**
 * PO Lifecycle 集成测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { createApFromPoInternal } from '@/features/finance';

interface TransactionContext {
    query: {
        arStatements: {
            findMany: vi.Mock;
        };
        purchaseOrders: {
            findFirst: vi.Mock;
        };
    };
    insert: {
        arStatements: vi.Mock;
    };
}

// Mock Modules
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    requirePermission: vi.fn(),
    checkPermission: vi.fn().mockReturnValue(true),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            purchaseOrders: {
                findFirst: vi.fn(),
            },
            suppliers: {
                findFirst: vi.fn(),
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
            const transactionContext = {
                query: {
                    purchaseOrders: {
                        findFirst: vi.fn(),
                        findMany: vi.fn().mockResolvedValue([])
                    },
                    suppliers: { findFirst: vi.fn() }
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
import { createPO, receivePO } from '../actions';

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
            contactName: null,
            contactPhone: null,
            contactEmail: null,
            address: null,
            settlementType: 'MONTHLY',
            bankAccount: null,
            isActive: true,
            remark: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        });

        const result = await createPO(input);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id', 'new-po-id');
        expect(result.data!.status).toBe('DRAFT');
    });

    it('should receive PO and trigger AP creation', async () => {
        const poId = 'po-123';

        // Mock transaction to return success
        const mockTransaction = db.transaction as unknown as import('vitest').Mock;
        mockTransaction.mockImplementation(async (callback) => {
            const transactionContext = {
                query: {
                    purchaseOrders: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: poId,
                            status: 'ORDERED',
                            totalCost: 1000,
                            orderId: 'order-1'
                        }),
                        findMany: vi.fn().mockResolvedValue([])
                    },
                    suppliers: { findFirst: vi.fn() }
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'new-ap-id' }])
                    })
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([{ id: 'updated-po-id' }])
                    })
                }),
            };
            return await callback(transactionContext as TransactionContext);
        });

        const result = await receivePO({ poId });

        expect(result.success).toBe(true);
        expect(db.update).toHaveBeenCalled();
        expect(createApFromPoInternal).toHaveBeenCalled();
    });

    it('should NOT receive PO if not in correct status', async () => {
        const poId = 'po-123';

        // Mock transaction to return error for DRAFT status
        const mockTransaction = db.transaction as unknown as import('vitest').Mock;
        mockTransaction.mockImplementation(async (callback) => {
            const transactionContext = {
                query: {
                    purchaseOrders: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: poId,
                            status: 'DRAFT',
                            totalCost: 1000,
                            orderId: 'order-1'
                        }),
                        findMany: vi.fn().mockResolvedValue([])
                    },
                    suppliers: { findFirst: vi.fn() }
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'new-ap-id' }])
                    })
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([{ id: 'updated-po-id' }])
                    })
                }),
            };
            return await callback(transactionContext as TransactionContext);
        });

        const result = await receivePO({ poId });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/status/);
        expect(createApFromPoInternal).not.toHaveBeenCalled();
    });
});
