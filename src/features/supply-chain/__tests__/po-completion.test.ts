
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { confirmPoReceipt } from '../actions/po-actions';
import { db } from '@/shared/api/db';
import { AuditService } from '@/shared/lib/audit-service';

// Mock Dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(async (cb) => cb(db)), // Pass-through
        query: {
            purchaseOrders: { findFirst: vi.fn() },
            warehouses: { findFirst: vi.fn() },
        },
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        execute: vi.fn().mockResolvedValue([]),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
    },
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn(),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: '00000000-0000-0000-0000-000000000001', tenantId: 'tenant-1' },
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('PO Completion (confirmPoReceipt)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should complete PO when fully received', async () => {
        const poId = '123e4567-e89b-42d3-a456-426614174000';
        const warehouseId = '123e4567-e89b-42d3-a456-426614174001';
        const itemId1 = '123e4567-e89b-42d3-a456-426614174002';
        const productId1 = '123e4567-e89b-42d3-a456-426614174004';

        // Setup PO data
        const mockPO = {
            id: poId,
            status: 'SHIPPED' as const,
            type: 'FINISHED' as const,
            tenantId: 'tenant-1',
            items: [
                { id: itemId1, productId: productId1, quantity: '10', receivedQuantity: '0', productName: 'Prod 1' }
            ]
        };

        // Mock DB returns
        const queryParams = {
            purchaseOrders: { findFirst: vi.fn().mockResolvedValue(mockPO) },
            warehouses: { findFirst: vi.fn().mockResolvedValue({ id: warehouseId }) }
        };
        (db.query as any) = queryParams;

        const mockSelectFn = vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ quantity: 10 }])
            })
        });
        (db.select as any) = mockSelectFn;

        const input = {
            poId: poId,
            warehouseId: warehouseId,
            receivedDate: new Date().toISOString(),
            items: [
                { poItemId: itemId1, productId: productId1, quantity: 10 }
            ]
        };

        const result = await confirmPoReceipt(input);

        // Debug output if fails
        if (!result.success) {
            console.log('Test failed result:', result);
        }

        if (result.success && result.data?.data) {
            expect(result.data.data.status).toBe('COMPLETED');
            expect(result.data.data.allFullyReceived).toBe(true);
        } else {
            // Fallback to inspect what happened if structure doesn't match
            console.log('Result mismatch:', JSON.stringify(result, null, 2));
            expect(result.data?.data?.status).toBe('COMPLETED');
        }
        expect(AuditService.recordFromSession).toHaveBeenCalled();
        expect(db.execute).toHaveBeenCalled();
    });

    it('should set PARTIALLY_RECEIVED when partially received', async () => {
        const poId = '123e4567-e89b-42d3-a456-426614174000';
        const warehouseId = '123e4567-e89b-42d3-a456-426614174001';
        const itemId1 = '123e4567-e89b-42d3-a456-426614174002';
        const itemId2 = '123e4567-e89b-42d3-a456-426614174003';
        const productId1 = '123e4567-e89b-42d3-a456-426614174004';
        const productId2 = '123e4567-e89b-42d3-a456-426614174005';

        const mockPO = {
            id: poId,
            status: 'SHIPPED' as const,
            type: 'FINISHED' as const,
            tenantId: 'tenant-1',
            items: [
                { id: itemId1, productId: productId1, quantity: '10', receivedQuantity: '0', productName: 'Prod 1' },
                { id: itemId2, productId: productId2, quantity: '10', receivedQuantity: '0', productName: 'Prod 2' }
            ]
        };

        (db.query as any).purchaseOrders.findFirst.mockResolvedValue(mockPO);
        (db.query as any).warehouses.findFirst.mockResolvedValue({ id: warehouseId });

        const mockSelectFn = vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ quantity: 5 }])
            })
        });
        (db.select as any) = mockSelectFn;

        const input = {
            poId: poId,
            warehouseId: warehouseId,
            receivedDate: new Date().toISOString(),
            items: [
                { poItemId: itemId1, productId: productId1, quantity: 5 },
            ]
        };

        const result = await confirmPoReceipt(input);

        expect(result.success).toBe(true);
        expect(result.success).toBe(true);
        if (result.success && result.data?.data) {
            expect(result.data.data.status).toBe('PARTIALLY_RECEIVED');
            expect(result.data.data.allFullyReceived).toBe(false);
        }
    });

    it('should fail if receiving more than ordered', async () => {
        const poId = '123e4567-e89b-42d3-a456-426614174000';
        const warehouseId = '123e4567-e89b-42d3-a456-426614174001';
        const itemId1 = '123e4567-e89b-42d3-a456-426614174002';
        const productId1 = '123e4567-e89b-42d3-a456-426614174004';

        const mockPO = {
            id: poId,
            status: 'SHIPPED' as const,
            type: 'FINISHED' as const,
            tenantId: 'tenant-1',
            items: [
                { id: itemId1, productId: productId1, quantity: '10', receivedQuantity: '5', productName: 'Prod 1' }
            ]
        };
        (db.query as any).purchaseOrders.findFirst.mockResolvedValue(mockPO);
        (db.query as any).warehouses.findFirst.mockResolvedValue({ id: 'wh-1' });

        const input = {
            poId: poId,
            warehouseId: warehouseId,
            receivedDate: new Date().toISOString(),
            items: [
                { poItemId: itemId1, productId: productId1, quantity: 6 }
            ]
        };


        const result = await confirmPoReceipt(input);

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/超过剩余可收货数量/);
    });
});
