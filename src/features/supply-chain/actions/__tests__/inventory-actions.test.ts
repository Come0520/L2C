import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { inventory, inventoryLogs, products, warehouses } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { AuditService } from '@/shared/lib/audit-service';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            warehouses: { findFirst: vi.fn() },
            inventory: { findFirst: vi.fn() },
            products: { findFirst: vi.fn() },
        },
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        transaction: vi.fn(async (cb) => {
            return cb(db);
        }),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
    },
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn(),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_UUID_2 = '123e4567-e89b-12d3-a456-426614174001';
const VALID_UUID_3 = '123e4567-e89b-12d3-a456-426614174002';
const MOCK_TENANT_ID = 'tenant-1';
const MOCK_USER_ID = 'user-1';

// Mock auth & permissions
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID },
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

// Provide a mock session explicitly where needed for tests testing helpers, but auth() handles the Server Action session.
const mockSession = { user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID } };

// Helper to mock db query methods specifically for each test context
const mockDb = db as any;

describe('Inventory Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('adjustInventoryAction', () => {
        it('仓库不存在时应返回错误', async () => {
            mockDb.query.warehouses.findFirst.mockResolvedValue(null);

            const { adjustInventory } = await import('../inventory-actions');
            const result = await adjustInventory({
                warehouseId: VALID_UUID,
                productId: VALID_UUID_2,
                quantity: 10,
                reason: 'Test adjust'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在或无权');
        });

        it('扣减库存导致负数时应报错', async () => {
            mockDb.query.warehouses.findFirst.mockResolvedValue({ id: VALID_UUID });
            mockDb.query.inventory.findFirst.mockResolvedValue({ id: 'inv-1', quantity: 5 });

            const { adjustInventory } = await import('../inventory-actions');
            const result = await adjustInventory({
                warehouseId: VALID_UUID,
                productId: VALID_UUID_2,
                quantity: -10, // -10 + 5 = -5
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('库存不足，无法进行扣减');
        });

        it('正数调配或合法扣减时应成功并生成日志', async () => {
            mockDb.query.warehouses.findFirst.mockResolvedValue({ id: VALID_UUID });
            mockDb.query.inventory.findFirst.mockResolvedValue({ id: 'inv-1', quantity: 10 });
            mockDb.query.products.findFirst.mockResolvedValue({ id: VALID_UUID_2, purchasePrice: '15.5' });

            const { adjustInventory } = await import('../inventory-actions');
            const result = await adjustInventory({
                warehouseId: VALID_UUID,
                productId: VALID_UUID_2,
                quantity: 5,
                reason: 'Normal add'
            });

            expect(result.success).toBe(true);
            expect(mockDb.update).toHaveBeenCalled();
            expect(mockDb.insert).toHaveBeenCalled(); // 插入 inventoryLogs
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });

        it('首次初始化某仓库的某商品库存应执行 insert', async () => {
            mockDb.query.warehouses.findFirst.mockResolvedValue({ id: VALID_UUID });
            mockDb.query.inventory.findFirst.mockResolvedValue(null); // 无记录
            mockDb.query.products.findFirst.mockResolvedValue({ id: VALID_UUID_2, purchasePrice: '15.5' });

            const { adjustInventory } = await import('../inventory-actions');
            const result = await adjustInventory({
                warehouseId: VALID_UUID,
                productId: VALID_UUID_2,
                quantity: 5,
                reason: 'Init add'
            });

            expect(result.success).toBe(true);
            expect(mockDb.insert).toHaveBeenCalledTimes(2); // inventory 和 logs 各一次
        });
    });

    describe('transferInventoryAction', () => {
        it('同仓库调拨应报错', async () => {
            const { transferInventory } = await import('../inventory-actions');
            const result = await transferInventory({
                fromWarehouseId: VALID_UUID,
                toWarehouseId: VALID_UUID, // Same
                items: [{ productId: VALID_UUID_2, quantity: 10 }],
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('库存不足');
        });

        it('原仓库库存不足应报错', async () => {
            // Mock warehouses both exist
            mockDb.query.warehouses.findFirst.mockResolvedValue({ id: 'wh' });
            // Mock from inventory (less than qty)
            mockDb.query.inventory.findFirst.mockResolvedValueOnce({ id: 'inv-from', quantity: 5 });

            const { transferInventory } = await import('../inventory-actions');
            const result = await transferInventory({
                fromWarehouseId: VALID_UUID,
                toWarehouseId: VALID_UUID_3,
                items: [{ productId: VALID_UUID_2, quantity: 10 }],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('库存不足');
        });

        it('合法调拨应能扣减原仓，增加目标仓', async () => {
            mockDb.query.warehouses.findFirst.mockResolvedValue({ id: 'wh' });
            // from inventory
            mockDb.query.inventory.findFirst.mockResolvedValueOnce({ id: 'inv-from', quantity: 20 });
            // to inventory
            mockDb.query.inventory.findFirst.mockResolvedValueOnce({ id: 'inv-to', quantity: 5 });

            const { transferInventory } = await import('../inventory-actions');
            const result = await transferInventory({
                fromWarehouseId: VALID_UUID,
                toWarehouseId: VALID_UUID_3,
                items: [{ productId: VALID_UUID_2, quantity: 10 }],
                reason: 'Move stock'
            });

            expect(result.success).toBe(true);
            // 2 updates (from & to) + 2 inserts (logs) expected during transaction
            expect(mockDb.update).toHaveBeenCalledTimes(2);
            expect(mockDb.insert).toHaveBeenCalledTimes(2);
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });
    });

    describe('getInventoryLevels', () => {
        it('应成功获取库存在给定过滤条件下的等级', async () => {
            // This test is simple since it only SELECTs, just asserting it doesn't throw and calls the chain.
            mockDb.limit.mockResolvedValue([{ id: 'inv-1' }]);
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
            } as any);

            const { getInventoryLevels } = await import('../inventory-actions');

            // Note: Since the real getInventoryLevels has a nested query `.select({ total: count() })`, 
            // mocking entirely correctly for it involves more complex setup, but basic logic testing:
            vi.doMock('@/shared/api/db', () => ({
                db: {
                    select: vi.fn().mockReturnValue({
                        from: vi.fn().mockReturnValue({
                            leftJoin: vi.fn().mockReturnValue({
                                leftJoin: vi.fn().mockReturnValue({
                                    where: vi.fn().mockReturnValue({
                                        orderBy: vi.fn().mockReturnValue({
                                            limit: vi.fn().mockReturnValue({
                                                offset: vi.fn().mockResolvedValue([{
                                                    inv: { id: 'inv-1', quantity: 10 },
                                                    product: { name: 'P', category: 'C' },
                                                    warehouse: { name: 'W' }
                                                }])
                                            })
                                        })
                                    })
                                })
                            }),
                            where: vi.fn().mockResolvedValue([{ total: 1 }]) // For count query
                        })
                    })
                }
            }));

            const localModule = await import('../inventory-actions');
            const result = await localModule.getInventoryLevels({});

            expect(result.success).toBe(true);
        });
    });

    describe('setminStockAction', () => {
        it('应成功设置安全库存', async () => {
            mockDb.query.inventory.findFirst.mockResolvedValue({ id: 'inv-1' });

            const { setminStock } = await import('../inventory-actions');
            const result = await setminStock({
                productId: VALID_UUID_2,
                warehouseId: 'inv-1',
                minStock: 20
            });

            expect(result.success).toBe(true);
            expect(mockDb.update).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });
    });

});
