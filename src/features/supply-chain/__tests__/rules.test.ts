/**
 * 拆单路由规则 (Split Route Rules) 单元测试
 *
 * 覆盖场景：
 *   1. 成功获取规则列表
 *   2. 成功创建规则
 *   3. 创建规则时名称为空应抛出异常
 *   4. 成功更新规则
 *   5. 更新不存在的规则应抛出异常
 *   6. 成功删除规则
 *   7. 删除不存在的规则应抛出异常
 *   8. 获取供应商列表
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============ 模拟依赖 ============

vi.mock('../helpers', () => ({
    requireAuth: vi.fn().mockResolvedValue({
        success: true,
        session: { user: { id: 'user-1', tenantId: 'tenant-1' } },
    }),
    requireManagePermission: vi.fn().mockResolvedValue({ success: true }),
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

vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockResolvedValue([]),
                }),
            }),
        }),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue([]),
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
            }),
        }),
        delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
        }),
        query: {
            splitRouteRules: {
                findFirst: vi.fn(),
            },
        },
    },
}));

import {
    getSplitRules,
    createSplitRule,
    updateSplitRule,
    deleteSplitRule,
    getAllSuppliers,
} from '../actions/rules';
import { db } from '@/shared/api/db';

// ============ 测试用例 ============

describe('拆单路由规则 (Split Route Rules)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSplitRules - 获取规则列表', () => {
        it('成功返回按优先级排序的规则列表', async () => {
            const mockRules = [
                { id: 'r-1', name: '窗帘规则', priority: 1 },
                { id: 'r-2', name: '百叶帘规则', priority: 2 },
            ];

            (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockResolvedValue(mockRules),
                    }),
                }),
            });

            const result = await getSplitRules();

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('窗帘规则');
        });
    });

    describe('createSplitRule - 创建规则', () => {
        it('成功创建新规则', async () => {
            const input = {
                name: '测试规则',
                priority: 10,
                conditions: '[{"field":"category","op":"eq","value":"CURTAIN"}]',
                targetType: 'PURCHASE_ORDER' as const,
                targetSupplierId: 'supplier-1',
                isActive: true,
            };

            const result = await createSplitRule(input);

            expect(result.success).toBe(true);
            expect(db.insert).toHaveBeenCalled();
        });

        it('名称为空时应抛出 Zod 验证错误', async () => {
            const input = {
                name: '', // 空名称 — 违反 .min(1)
                priority: 1,
                conditions: '[]',
                targetType: 'PURCHASE_ORDER' as const,
                isActive: true,
            };

            await expect(createSplitRule(input)).rejects.toThrow();
        });
    });

    describe('updateSplitRule - 更新规则', () => {
        it('成功更新已存在的规则', async () => {
             
            (db.query as any).splitRouteRules.findFirst.mockResolvedValue({
                id: 'r-1',
                tenantId: 'tenant-1',
                name: '旧规则',
            });

            const input = {
                name: '更新后的规则',
                priority: 20,
                conditions: '[{"field":"category","op":"eq","value":"BLIND"}]',
                targetType: 'SERVICE_TASK' as const,
                isActive: true,
            };

            const result = await updateSplitRule('r-1', input);

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
        });

        it('规则不存在时应抛出异常', async () => {
             
            (db.query as any).splitRouteRules.findFirst.mockResolvedValue(null);

            const input = {
                name: '不存在的规则',
                priority: 1,
                conditions: '[]',
                targetType: 'PURCHASE_ORDER' as const,
                isActive: true,
            };

            await expect(updateSplitRule('non-existent', input)).rejects.toThrow('规则不存在或无权操作');
        });
    });

    describe('deleteSplitRule - 删除规则', () => {
        it('成功删除已存在的规则', async () => {
             
            (db.query as any).splitRouteRules.findFirst.mockResolvedValue({
                id: 'r-1',
                tenantId: 'tenant-1',
            });

            const result = await deleteSplitRule('r-1');

            expect(result.success).toBe(true);
            expect(db.delete).toHaveBeenCalled();
        });

        it('删除不存在的规则应抛出异常', async () => {
             
            (db.query as any).splitRouteRules.findFirst.mockResolvedValue(null);

            await expect(deleteSplitRule('non-existent')).rejects.toThrow('规则不存在或无权操作');
        });
    });

    describe('getAllSuppliers - 获取供应商列表', () => {
        it('成功返回当前租户的供应商列表', async () => {
            const mockSuppliers = [
                { id: 's-1', name: '供应商A', supplierNo: 'SUP-001' },
                { id: 's-2', name: '供应商B', supplierNo: 'SUP-002' },
            ];

            (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(mockSuppliers),
                }),
            });

            const result = await getAllSuppliers();

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('供应商A');
        });
    });
});
