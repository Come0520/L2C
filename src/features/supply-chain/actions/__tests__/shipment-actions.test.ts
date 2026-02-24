/**
 * Supply Chain 模块 Server Actions 集成测试 - 发货管理 (Shipment)
 *
 * 覆盖范围：
 * - createShipment (含状态转换校验)
 * - updateShipment
 * - getShipments
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const VALID_UUID = '9ca46114-1f1f-4efc-8b83-b7dc0ce5fa01';

const mockDb = createMockDb(['purchaseOrders', 'poShipments']);

// 事务 mock
mockDb.transaction = vi.fn(async (cb) => {
    return cb({
        query: mockDb.query,
        insert: mockDb.insert,
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{}]) })
        }),
        delete: mockDb.delete,
    });
});

vi.mock('@/shared/api/db', () => ({ db: mockDb }));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

// shipment-actions 使用 helpers.ts 进行鉴权，需要 mock 该文件
vi.mock('../../helpers', () => ({
    requireAuth: vi.fn().mockResolvedValue({ success: true, session: MOCK_SESSION }),
    requirePOManagePermission: vi.fn().mockResolvedValue({ success: true }),
    requireViewPermission: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn().mockResolvedValue(true) }
}));

describe('Shipment Actions (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // 重新注入 helpers mock
        const helpers = await import('../../helpers');
        vi.mocked(helpers.requireAuth).mockResolvedValue({ success: true, session: MOCK_SESSION });
        vi.mocked(helpers.requirePOManagePermission).mockResolvedValue({ success: true });
        vi.mocked(helpers.requireViewPermission).mockResolvedValue({ success: true });
    });

    describe('createShipment', () => {
        it('采购单不存在时应返回错误', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue(null);

            const { createShipment } = await import('../shipment-actions');
            const result = await createShipment({ poId: VALID_UUID });

            expect(result.success).toBe(false);
            expect(result.error).toBe('采购单不存在');
        });

        it('状态不允许发货时应返回错误', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ id: VALID_UUID, status: 'DRAFT' });

            const { createShipment } = await import('../shipment-actions');
            const result = await createShipment({ poId: VALID_UUID });

            expect(result.success).toBe(false);
            expect(result.error).toContain('不允许发货');
        });

        it('READY 状态下应成功创建物流记录并更新 PO 状态', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ id: VALID_UUID, status: 'READY' });
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'ship-1' }])
                })
            } as any);

            const { createShipment } = await import('../shipment-actions');
            const result = await createShipment({
                poId: VALID_UUID,
                logisticsCompany: '顺丰速运',
                logisticsNo: 'SF1234567890',
            });

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('ship-1');
            expect(result.message).toBe('发货信息已录入');
            expect(mockDb.transaction).toHaveBeenCalled();
        });

        it('未授权时应返回错误', async () => {
            const helpers = await import('../../helpers');
            vi.mocked(helpers.requireAuth).mockResolvedValue({ success: false, error: '未授权' } as any);

            const { createShipment } = await import('../shipment-actions');
            const result = await createShipment({ poId: VALID_UUID });

            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });
    });

    describe('updateShipment', () => {
        it('物流记录不存在时应返回错误', async () => {
            mockDb.query.poShipments.findFirst.mockResolvedValue(null);

            const { updateShipment } = await import('../shipment-actions');
            const result = await updateShipment('ship-x', {
                logisticsCompany: '中通快递'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('物流记录不存在');
        });

        it('应成功更新物流信息并记录审计', async () => {
            mockDb.query.poShipments.findFirst.mockResolvedValue({
                id: 'ship-1',
                logisticsCompany: '顺丰速运',
                logisticsNo: 'SF111'
            });
            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{}])
                })
            });

            const { updateShipment } = await import('../shipment-actions');
            const { AuditService } = await import('@/shared/lib/audit-service');
            const result = await updateShipment('ship-1', {
                logisticsCompany: '中通快递',
                logisticsNo: 'ZT999'
            });

            expect(result.success).toBe(true);
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'poShipments', 'ship-1', 'UPDATE', expect.anything()
            );
        });
    });

    describe('getShipments', () => {
        it('采购单不存在时应返回空数组', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue(null);

            const { getShipments } = await import('../shipment-actions');
            const result = await getShipments({ poId: VALID_UUID });

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('应返回按时间倒序的物流记录', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ id: VALID_UUID });
            mockDb.query.poShipments.findMany.mockResolvedValue([
                { id: 'ship-2', logisticsNo: 'ZT999' },
                { id: 'ship-1', logisticsNo: 'SF111' }
            ]);

            const { getShipments } = await import('../shipment-actions');
            const result = await getShipments({ poId: VALID_UUID });

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].id).toBe('ship-2');
        });
    });
});
