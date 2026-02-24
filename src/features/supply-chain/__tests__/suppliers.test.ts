
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { createSupplier, updateSupplier, getSuppliers } from '../actions/supplier-actions'; // Fixed import name

// Mock Modules
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => {
    const mockAuth = vi.fn();
    return {
        auth: mockAuth,
        checkPermission: vi.fn().mockResolvedValue(true),
        requireUser: vi.fn().mockResolvedValue({
            user: { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'ADMIN' },
        })
    };
});

vi.mock('@/shared/lib/utils', async (importOriginal) => {
    const actual = await importOriginal();
    return {
         
        ...(actual as any),
        generateDocNo: vi.fn().mockResolvedValue('SUP-001'),
    };
});

vi.mock('../constants', () => ({
    SUPPLY_CHAIN_PATHS: {
        SUPPLIERS: '/supply-chain/suppliers',
        PURCHASE_ORDERS: '/supply-chain/purchase-orders',
        PENDING_POOL: '/supply-chain/pending-pool',
        PROCESSING_ORDERS: '/supply-chain/processing-orders',
        INVENTORY: '/supply-chain/inventory',
        RULES: '/supply-chain/rules',
    },
    SUPPLY_CHAIN_ERRORS: {},
    successResponse: vi.fn((data, message) => ({ success: true, data, message })),
    errorResponse: vi.fn((error) => ({ success: false, error })),
}));

// Mock DB with support for select chaining and awaiting
vi.mock('@/shared/api/db', () => ({
    db: {
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-supplier-id', supplierNo: 'SUP-001' }])
            })
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'updated-supplier-id' }])
                })
            })
        }),
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    // Make it thenable to support await
                    then: (resolve: any) => resolve([{ count: 1 }]),
                    // Also keep chaining just in case
                    orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            offset: vi.fn().mockResolvedValue([
                                { id: 'sup-1', name: 'Supplier 1' }
                            ])
                        })
                    })
                })
            })
        }),
        query: {
            suppliers: {
                findFirst: vi.fn(), // For duplicate check
                findMany: vi.fn().mockResolvedValue([{ id: 'sup-1', name: 'Supplier 1' }]) // For query.suppliers usage
            }
        },
        $count: vi.fn().mockResolvedValue(1)
    },
}));

describe('Supplier Actions', () => {
    const mockSession = {
        user: { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
    });

    it('should create a supplier', async () => {
        const input = {
            name: 'Test Supplier',
            supplierType: 'SUPPLIER' as const,
            paymentPeriod: 'MONTHLY' as const,
            contactPerson: 'Contact',
            phone: '1234567890',
        };

        // Mock no existing supplier
        (db.query.suppliers.findFirst as unknown as import('vitest').Mock).mockResolvedValue(null);

        const result = await createSupplier(input);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id', 'new-supplier-id');
    });

    it('should update a supplier', async () => {
        const input = {
            id: 'sup-1',
            name: 'Updated Supplier',
        };

        const result = await updateSupplier(input);

        expect(result.success).toBe(true);
        expect(db.update).toHaveBeenCalled();
    });

    it('should get suppliers list', async () => {
        const result = await getSuppliers({ page: 1, pageSize: 10 }); // Use getSuppliers

        expect(result.success).toBe(true);
        // db.query.suppliers.findMany returns an array, so data.data should be that array
        expect(result.data?.data).toHaveLength(1);
        expect(result.data?.total).toBe(1);
    });
});
