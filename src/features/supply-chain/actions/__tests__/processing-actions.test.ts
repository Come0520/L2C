import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { workOrders, workOrderItems, suppliers, orders, orderItems } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { AuditService } from '@/shared/lib/audit-service';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {},
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        transaction: vi.fn(async (cb) => {
            return cb(db);
        }),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
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

const mockDb = db as any;

describe('Processing Orders Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProcessingOrders', () => {
        it('应能正确获取并映射加工单列表', async () => {
            const tempMockSelect = vi.fn()
                .mockReturnValueOnce({
                    from: vi.fn().mockReturnThis(),
                    leftJoin: vi.fn().mockReturnThis(),
                    where: vi.fn().mockReturnThis(),
                    orderBy: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockReturnThis(),
                    offset: vi.fn().mockResolvedValue([
                        {
                            wo: { id: 'wo-1', woNo: 'WO-001', status: 'PENDING', createdAt: '2024-01-01' },
                            supplier: { id: 'sup-1', name: 'Vendor A' },
                            order: { id: 'ord-1', orderNo: 'ORD-001' }
                        }
                    ])
                })
                .mockReturnValueOnce({
                    from: vi.fn().mockReturnThis(),
                    where: vi.fn().mockResolvedValue([{ total: 1 }])
                });

            mockDb.select.mockImplementation(tempMockSelect);

            const { getProcessingOrders } = await import('../processing-actions');
            const result = await getProcessingOrders({ page: 1, pageSize: 20 });

            mockDb.select.mockRestore();
            mockDb.select = vi.fn().mockReturnThis();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].processingNo).toBe('WO-001');
            expect(result.total).toBe(1);
        });
    });

    describe('getProcessingOrderById', () => {
        it('单据不存在时返回错误', async () => {
            mockDb.where.mockResolvedValueOnce([]); // No record found

            const { getProcessingOrderById } = await import('../processing-actions');
            const result = await getProcessingOrderById({ id: VALID_UUID });

            expect(result.success).toBe(false);
            expect(result.error).toBe('加工单不存在');
        });

        it('应成功返回带明细的加工单', async () => {
            mockDb.where.mockResolvedValueOnce([
                {
                    wo: { id: VALID_UUID, woNo: 'WO-001', status: 'PENDING' },
                    supplier: { id: 'sup-1', name: 'Vendor A' },
                    order: { id: 'ord-1', orderNo: 'ORD-001' }
                }
            ]);
            // Mock items
            mockDb.where.mockResolvedValueOnce([
                {
                    woItem: { id: 'item-1', status: 'PENDING' },
                    orderItem: { quantity: 10, productName: 'Test Product' },
                    product: { sku: 'SKU-001' }
                }
            ]);

            const { getProcessingOrderById } = await import('../processing-actions');
            const result = await getProcessingOrderById({ id: VALID_UUID });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.processingNo).toBe('WO-001');
            expect(result.data?.items).toHaveLength(1);
        });
    });

    describe('updateProcessingOrderStatus', () => {
        it('更新状态时应记录时间并审计', async () => {
            const { updateProcessingOrderStatus } = await import('../processing-actions');
            const result = await updateProcessingOrderStatus(VALID_UUID, 'PROCESSING');

            expect(result.success).toBe(true);
            expect(mockDb.update).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });
    });

    describe('createProcessingOrder', () => {
        it('关联订单不存在时应返回错误', async () => {
            mockDb.limit.mockResolvedValueOnce([]); // mock select order return empty

            const { createProcessingOrder } = await import('../processing-actions');
            const result = await createProcessingOrder({
                orderId: VALID_UUID,
                poId: VALID_UUID_2,
                supplierId: VALID_UUID_3,
                items: [{ orderItemId: '123e4567-e89b-12d3-a456-426614174003' }]
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });

        it('校验通过时应在事务中创建并记录审计日志', async () => {
            mockDb.limit.mockResolvedValueOnce([{ id: VALID_UUID }]); // mock order exists
            mockDb.returning.mockResolvedValueOnce([{ id: VALID_UUID }]); // mock insert returning id

            const { createProcessingOrder } = await import('../processing-actions');
            const result = await createProcessingOrder({
                orderId: VALID_UUID,
                poId: VALID_UUID_2,
                supplierId: VALID_UUID_3,
                items: [{ orderItemId: '123e4567-e89b-12d3-a456-426614174003' }]
            });

            expect(result.success).toBe(true);
            expect(result.id).toBe(VALID_UUID);
            expect(result.woNo).toMatch(/^WO/);
            expect(mockDb.transaction).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalled(); // Should log audit
        });
    });

    describe('updateProcessingOrder', () => {
        it('仅在 PENDING 状态下允许更新', async () => {
            mockDb.limit.mockResolvedValueOnce([{ id: VALID_UUID, status: 'PROCESSING' }]); // wrong status

            const { updateProcessingOrder } = await import('../processing-actions');
            const result = await updateProcessingOrder(VALID_UUID, {
                supplierId: VALID_UUID_2,
                remark: 'New remark'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('不允许修改');
        });

        it('可以更新供应商和备注并记录审计日志', async () => {
            mockDb.limit.mockResolvedValueOnce([{ id: VALID_UUID, status: 'PENDING' }]);

            const { updateProcessingOrder } = await import('../processing-actions');
            const result = await updateProcessingOrder(VALID_UUID, {
                supplierId: VALID_UUID_2,
                remark: 'Updated'
            });

            expect(result.success).toBe(true);
            expect(mockDb.update).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });
    });
});
