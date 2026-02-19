
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSplitRouting } from '../split-engine';
import { db } from '@/shared/api/db';
import { AuditService } from '@/shared/lib/audit-service';

// Mock Dependencies
vi.mock('@/shared/api/db', () => {
    const mockChain = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
    };
    return {
        db: {
            select: vi.fn().mockReturnValue(mockChain),
            insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue(mockChain) }),
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
            delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
            query: {
                splitRouteRules: {
                    findMany: vi.fn().mockResolvedValue([]),
                },
                purchaseOrders: {
                    findFirst: vi.fn(),
                },
            },
            transaction: vi.fn(async (cb) => cb(db)), // Simple pass-through
        },
    };
});

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: vi.fn(),
        recordFromSession: vi.fn(),
    },
}));

vi.mock('@/shared/lib/utils', () => ({
    generateDocNo: vi.fn((prefix) => `${prefix}-${Date.now()}`),
}));

// Test Data
const mockSession = {
    user: { id: 'user-1', tenantId: 'tenant-1' },
    expires: '2025-01-01',
};

const mockOrderItems = [
    {
        orderItemId: 'item-1',
        orderId: 'order-1',
        tenantId: 'tenant-1',
        productId: 'prod-1',
        productName: 'Finished Product',
        category: 'CURTAIN',
        quantity: '10',
        width: null,
        height: null,
        unitPrice: '100',
        subtotal: '1000',
        productType: 'FINISHED',
        defaultSupplierId: 'sup-1',
        quoteItemId: null,
    },
    {
        orderItemId: 'item-2',
        orderId: 'order-1',
        tenantId: 'tenant-1',
        productId: 'prod-2',
        productName: 'Custom Fabric',
        category: 'FABRIC',
        quantity: '50',
        width: '100',
        height: '200',
        unitPrice: '20',
        subtotal: '1000',
        productType: 'CUSTOM', // Implicitly handled as CUSTOM in logic if not FINISHED
        defaultSupplierId: 'sup-2',
        quoteItemId: null,
    },
];

const mockSuppliers = [
    { id: 'sup-1', name: 'Supplier One', supplierType: 'SUPPLIER' },
    { id: 'sup-2', name: 'Supplier Two', supplierType: 'SUPPLIER' },
];

describe('Split Engine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle empty order items', async () => {
        // Mock getEnrichedOrderItems returning empty
        const mockWhere = vi.fn().mockResolvedValue([]);
        (db.select as any).mockReturnValue({
            from: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                    where: mockWhere
                })
            })
        });

        const result = await executeSplitRouting('order-1', 'tenant-1', mockSession as any);

        expect(result.createdPOIds).toHaveLength(0);
        expect(result.summary.totalItems).toBe(0);
    });

    it('should split FINISHED items to PO', async () => {
        // Mock items
        const items = [mockOrderItems[0]]; // FINISHED

        // Mock DB chain for getEnrichedOrderItems
        const mockChain = {
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(items),
        };
        (db.select as any).mockReturnValue(mockChain);

        // Mock batchGetSuppliers (not needed for FINISHED items as they use defaultSupplierId directly?)
        // Actually resolveFinishedItems does not call batchGetSuppliers, it just checks defaultSupplierId.
        // It DOES NOT check supplier existence via batchGetSuppliers in current logic?
        // Let's check logic: resolveFinishedItems -> returns items -> generateSplitResult -> assigns names via batchGetSuppliers.

        // Mock batchGetSuppliers result via db.select
        // The SECOND call to db.select is for batchGetSuppliers
        // We need to mock different return values for sequential calls to db.select or match partial calls.
        // Since strict sequence mocking is hard with basic vi.fn, we can check the arguments or inspect logic.
        // generateSplitResult calls batchGetSuppliers for name lookup.

        // Let's refine the mock to differentiate calls.
        (db.select as any).mockImplementation(() => ({
            from: vi.fn().mockImplementation((table) => ({
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockImplementation(async () => {
                    // Primitive check based on context or just return based on call count?
                    // This is 'getEnrichedOrderItems' if table is orderItems (or joined)
                    // This is 'batchGetSuppliers' if table is suppliers
                    // table object in drizzle is opaque.
                    // We can accept that both return their respective data if we can distinguish.
                    // But we can't easily.

                    // Simple hack: Return items first, then suppliers.
                    return items; // Logic requires suppliers logic to be called?
                })
            }))
        }));

        // For this specific test, we need `getEnrichedOrderItems` to return `items`.
        // And `generateSplitResult` -> `batchGetSuppliers` to return valid supplier name for 'sup-1'.

        const mockSelectFn = vi.fn();
        (db.select as any) = mockSelectFn;

        // We need 2 calls:
        // 1. getEnrichedOrderItems: returns items
        // 2. batchGetSuppliers (inside generateSplitResult): returns [{id:'sup-1', name:'Sup1', ...}]

        const chain1 = {
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(items)
        };

        const chain2 = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([{ id: 'sup-1', name: 'Supplier One', supplierType: 'SUPPLIER' }])
        };

        mockSelectFn
            .mockReturnValueOnce(chain1) // getEnrichedOrderItems
            .mockReturnValueOnce(chain2); // batchGetSuppliers (in generateSplitResult)

        // Mock transaction
        (db.transaction as any).mockImplementation(async (cb: any) => cb(db));

        // Mock insert returning valid ID
        (db.insert as any).mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'po-1' }])
            })
        });

        const result = await executeSplitRouting('order-1', 'tenant-1', mockSession as any);

        expect(result.createdPOIds).toHaveLength(1);
        expect(result.summary.finishedCount).toBe(1);
        expect(result.summary.poCount).toBe(1);
        expect(AuditService.recordFromSession).toHaveBeenCalledWith(
            expect.anything(), 'purchaseOrders', 'po-1', 'CREATE', expect.anything(), expect.anything()
        );
    });

    it('should split CUSTOM items to WO if Processor', async () => {
        const items = [{
            ...mockOrderItems[1],
            productType: 'CUSTOM' as any,
            defaultSupplierId: 'sup-proc',
            resolvedSupplierId: 'sup-proc'
        }]; // CUSTOM item

        const mockSelectFn = vi.fn();
        (db.select as any) = mockSelectFn;

        // 1. getEnrichedOrderItems
        mockSelectFn.mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(items)
        });

        // 2. batchGetSuppliers (resolveBySupplierType)
        mockSelectFn.mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([{
                id: 'sup-proc',
                name: 'Processor One',
                supplierType: 'PROCESSOR'
            }])
        });

        // 3. batchGetSuppliers (generateSplitResult - name lookup) if needed, 
        // but resolveBySupplierType already fills resolvedSupplierName for Processor case?
        // Let's check logic:
        // result.push({ ..., resolvedSupplierName: supplier.name ... }) 
        // So name is set. generateSplitResult checks `if (!item.resolvedSupplierName)`.
        // So 3rd call shouldn't happen or is empty.

        (db.transaction as any).mockImplementation(async (cb: any) => cb(db));

        // Mock insert for WO (productionTasks)
        (db.insert as any).mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'task-1' }])
            })
        });

        const result = await executeSplitRouting('order-1', 'tenant-1', mockSession as any);

        expect(result.createdTaskIds).toHaveLength(1);
        expect(result.summary.woCount).toBe(1);
        expect(result.summary.customCount).toBe(1);
    });
});
