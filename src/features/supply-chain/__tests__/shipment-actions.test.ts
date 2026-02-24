/**
 * 发货管理 (Shipment Actions) 单元测试
 *
 * 覆盖场景：
 *   1. 成功创建发货记录并更新 PO 状态为 SHIPPED
 *   2. 当 PO 状态不允许发货时应返回错误
 *   3. 成功更新发货记录
 *   4. 更新不存在的发货记录应返回错误
 *   5. 查询发货记录列表
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 避免 mock 工厂提升 (hoisting) 导致引用未初始化变量
const { mockSession } = vi.hoisted(() => ({
    mockSession: {
        user: { id: 'user-1', tenantId: 'tenant-1' },
    },
}));

// ============ 模拟依赖 ============

vi.mock('../helpers', () => ({
    requireAuth: vi.fn().mockResolvedValue({ success: true, session: { user: { id: 'user-1', tenantId: 'tenant-1' } } }),
    requirePOManagePermission: vi.fn().mockResolvedValue({ success: true }),
    requireViewPermission: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn(),
    },
}));

// 构建事务 Mock
const { mockTx } = vi.hoisted(() => {
    const tx = {
        query: {
            purchaseOrders: { findFirst: vi.fn() },
        },
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'shipment-1', poId: 'po-1' }]),
            }),
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
            }),
        }),
    };
    return { mockTx: tx };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(async (cb: CallableFunction) => cb(mockTx)),
        query: {
            purchaseOrders: { findFirst: vi.fn() },
            poShipments: { findFirst: vi.fn(), findMany: vi.fn() },
        },
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
            }),
        }),
    },
}));

import { createShipment, updateShipment, getShipments } from '../actions/shipment-actions';
import { db } from '@/shared/api/db';

// ============ 测试用例 ============

describe('发货管理 (Shipment Actions)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 恢复默认的 transaction pass-through
        (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
            async (cb: CallableFunction) => cb(mockTx)
        );
        // 恢复 tx insert/update 的默认返回值
        mockTx.insert.mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'shipment-1', poId: 'po-1' }]),
            }),
        });
        mockTx.update.mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
            }),
        });
    });

    describe('createShipment - 创建发货记录', () => {
        it('当 PO 状态为 READY 时应成功创建发货记录', async () => {
            mockTx.query.purchaseOrders.findFirst.mockResolvedValue({
                id: 'po-1',
                status: 'READY',
            });

            const input = {
                poId: '123e4567-e89b-42d3-a456-426614174000',
                logisticsCompany: '顺丰速运',
                logisticsNo: 'SF1234567890',
            };

            const result = await createShipment(input);

            expect(result.success).toBe(true);
            expect(mockTx.insert).toHaveBeenCalled();
            expect(mockTx.update).toHaveBeenCalled();
        });

        it('当 PO 不存在时应返回错误', async () => {
            mockTx.query.purchaseOrders.findFirst.mockResolvedValue(null);

            const input = {
                poId: '123e4567-e89b-42d3-a456-426614174000',
            };

            const result = await createShipment(input);

            expect(result.success).toBe(false);
            expect(result.error).toContain('采购单不存在');
        });

        it('当 PO 状态为 DRAFT 时不允许发货', async () => {
            mockTx.query.purchaseOrders.findFirst.mockResolvedValue({
                id: 'po-1',
                status: 'DRAFT',
            });

            const input = {
                poId: '123e4567-e89b-42d3-a456-426614174000',
            };

            const result = await createShipment(input);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不允许发货');
        });

        it('当 PO 状态为 COMPLETED 时不允许发货', async () => {
            mockTx.query.purchaseOrders.findFirst.mockResolvedValue({
                id: 'po-1',
                status: 'COMPLETED',
            });

            const input = {
                poId: '123e4567-e89b-42d3-a456-426614174000',
            };

            const result = await createShipment(input);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不允许发货');
        });
    });

    describe('updateShipment - 更新发货记录', () => {
        it('成功更新已存在的发货记录', async () => {
             
            (db.query as any).poShipments.findFirst.mockResolvedValue({
                id: 'shipment-1',
                logisticsCompany: '顺丰速运',
                logisticsNo: 'SF001',
            });

            const result = await updateShipment('shipment-1', {
                logisticsCompany: '圆通速递',
                logisticsNo: 'YT999',
            });

            expect(result.success).toBe(true);
        });

        it('更新不存在的发货记录应返回错误', async () => {
             
            (db.query as any).poShipments.findFirst.mockResolvedValue(null);

            const result = await updateShipment('non-existent-id', {
                logisticsCompany: '圆通速递',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('物流记录不存在');
        });
    });

    describe('getShipments - 查询发货记录', () => {
        it('成功返回指定 PO 的发货记录列表', async () => {
             
            (db.query as any).purchaseOrders.findFirst.mockResolvedValue({ id: 'po-1' });
             
            (db.query as any).poShipments.findMany.mockResolvedValue([
                { id: 'ship-1', logisticsNo: 'SF001' },
                { id: 'ship-2', logisticsNo: 'SF002' },
            ]);

            const result = await getShipments({ poId: 'po-1' });

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });

        it('PO 不存在时返回空列表', async () => {
             
            (db.query as any).purchaseOrders.findFirst.mockResolvedValue(null);

            const result = await getShipments({ poId: 'non-existent' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('poId 为空时返回空列表', async () => {
            const result = await getShipments({ poId: '' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });
    });
});
