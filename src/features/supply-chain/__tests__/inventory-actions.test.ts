
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { adjustInventory, transferInventory } from '../actions/inventory-actions';

// Mock Modules
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockReturnValue(true),
}));

// Mock DB Transaction structure
const mockTx = {
    update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 'inv-1', quantity: 90 }])
        })
    }),
    insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'log-1' }])
        })
    }),
    query: {
        inventory: {
            findFirst: vi.fn().mockResolvedValue({
                id: 'inv-1',
                quantity: 100,
                warehouseId: 'wh-1',
                productId: 'prod-1',
                tenantId: 'test-tenant-id'
            })
        }
    }
};

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            inventory: {
                findFirst: vi.fn().mockResolvedValue({
                    id: 'inv-1',
                    quantity: 100,
                    warehouseId: 'wh-1'
                })
            },
            warehouses: {
                findFirst: vi.fn().mockResolvedValue({ id: 'wh-1', name: 'Warehouse 1' })
            }
        },
        transaction: vi.fn().mockImplementation(async (callback) => {
            return await callback(mockTx);
        })
    },
}));

describe('Inventory Actions', () => {
    const mockSession = {
        user: { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
    });

    it('should adjust inventory', async () => {
        const input = {
            warehouseId: 'wh-1',
            productId: 'prod-1',
            quantity: -10,
            reason: 'Test Adjustment'
        };

        const result = await adjustInventory(input);

        expect(result.success).toBe(true);
        expect(mockTx.update).toHaveBeenCalled(); // Update existing inventory
        expect(mockTx.insert).toHaveBeenCalled(); // Insert log
    });

    it('should transfer inventory', async () => {
        const input = {
            fromWarehouseId: 'wh-1',
            toWarehouseId: 'wh-2',
            items: [
                { productId: 'prod-1', quantity: 10 }
            ],
            reason: 'Test Transfer'
        };

        // Mock warehouse check
        const mockWarehouseFind = db.query.warehouses.findFirst as unknown as import('vitest').Mock;
        mockWarehouseFind
            .mockResolvedValueOnce({ id: 'wh-1' }) // Source exists
            .mockResolvedValueOnce({ id: 'wh-2' }); // Target exists

        const result = await transferInventory(input);

        expect(result.success).toBe(true);
        // Should update source and target, insert logs
    });
});
