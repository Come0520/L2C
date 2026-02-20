/**
 * 拆单规则 (Split Route Rules) Server Actions 集成测试
 *
 * 覆盖：getSplitRules / createSplitRule / updateSplitRule / deleteSplitRule / getAllSuppliers
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============ Mock 闭包 ============
const { mockDb, mockSession, mockRequireAuth, mockRequireView, mockRequireManage } = vi.hoisted(() => {
    const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        query: {
            splitRouteRules: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
        },
    };
    const mockSession = {
        user: { id: 'user-1', tenantId: 'tenant-1', name: 'Test' },
        expires: '2099-01-01',
    };
    return {
        mockDb,
        mockSession,
        mockRequireAuth: vi.fn().mockResolvedValue({ success: true, session: mockSession }),
        mockRequireView: vi.fn().mockResolvedValue({ success: true }),
        mockRequireManage: vi.fn().mockResolvedValue({ success: true }),
    };
});

vi.mock('@/shared/api/db', () => ({ db: mockDb }));
vi.mock('@/shared/api/schema', () => ({
    splitRouteRules: { id: 'id', tenantId: 'tenantId', priority: 'priority', isActive: 'isActive' },
    suppliers: { id: 'id', tenantId: 'tenantId', name: 'name', supplierNo: 'supplierNo' },
}));
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...a: unknown[]) => a),
    and: vi.fn((...a: unknown[]) => a),
    desc: vi.fn((a: unknown) => a),
}));
vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn() },
}));
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// 关键 mock：rules.ts 使用 ../helpers 中的 requireAuth / requireManagePermission / requireViewPermission
vi.mock('../../helpers', () => ({
    requireAuth: mockRequireAuth,
    requireManagePermission: mockRequireManage,
    requireViewPermission: mockRequireView,
}));

// ============ 测试开始 ============

describe('Split Route Rules Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 恢复默认 resolve
        mockRequireAuth.mockResolvedValue({ success: true, session: mockSession });
        mockRequireView.mockResolvedValue({ success: true });
        mockRequireManage.mockResolvedValue({ success: true });
    });

    // ---------- getSplitRules ----------
    describe('getSplitRules', () => {
        it('未授权时应抛出错误', async () => {
            mockRequireAuth.mockResolvedValueOnce({ success: false, error: '未登录' });

            const { getSplitRules } = await import('../rules');
            await expect(getSplitRules()).rejects.toThrow('未登录');
        });

        it('权限不足时应抛出错误', async () => {
            mockRequireView.mockResolvedValueOnce({ success: false, error: '权限不足' });

            const { getSplitRules } = await import('../rules');
            await expect(getSplitRules()).rejects.toThrow('权限不足');
        });

        it('应正常返回规则列表', async () => {
            const mockRules = [
                { id: 'rule-1', name: '窗帘规则', priority: 1 },
                { id: 'rule-2', name: '布料规则', priority: 2 },
            ];
            // getSplitRules 链式: db.select().from().where().orderBy()
            mockDb.orderBy.mockResolvedValueOnce(mockRules);

            const { getSplitRules } = await import('../rules');
            const result = await getSplitRules();

            expect(result).toEqual(mockRules);
            expect(mockDb.select).toHaveBeenCalled();
        });
    });

    // ---------- createSplitRule ----------
    describe('createSplitRule', () => {
        const validInput = {
            name: '新规则',
            priority: 10,
            conditions: JSON.stringify([{ field: 'category', operator: 'eq', value: 'CURTAIN' }]),
            targetType: 'PURCHASE_ORDER' as const,
            targetSupplierId: 'a1b2c3d4-e5f6-1a2b-8c3d-4e5f6a7b8c9d',
            isActive: true,
        };

        it('应成功创建规则并记录审计日志', async () => {
            const { createSplitRule } = await import('../rules');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await createSplitRule(validInput);

            expect(result).toEqual({ success: true });
            expect(mockDb.insert).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                mockSession, 'splitRouteRules', 'new', 'CREATE', expect.anything()
            );
        });

        it('权限不足时应抛出错误', async () => {
            mockRequireManage.mockResolvedValueOnce({ success: false, error: '无管理权限' });

            const { createSplitRule } = await import('../rules');
            await expect(createSplitRule(validInput)).rejects.toThrow('无管理权限');
        });
    });

    // ---------- updateSplitRule ----------
    describe('updateSplitRule', () => {
        const validInput = {
            name: '更新规则',
            priority: 5,
            conditions: JSON.stringify([{ field: 'category', operator: 'eq', value: 'BLIND' }]),
            targetType: 'PURCHASE_ORDER' as const,
            targetSupplierId: null,
            isActive: false,
        };

        it('规则不存在时应抛出错误', async () => {
            mockDb.query.splitRouteRules.findFirst.mockResolvedValueOnce(null);

            const { updateSplitRule } = await import('../rules');
            await expect(updateSplitRule('non-exist', validInput)).rejects.toThrow('规则不存在或无权操作');
        });

        it('应成功更新规则并记录审计日志', async () => {
            mockDb.query.splitRouteRules.findFirst.mockResolvedValueOnce({ id: 'rule-1' });
            // update().set().where() 链
            mockDb.where.mockResolvedValueOnce(undefined);

            const { updateSplitRule } = await import('../rules');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await updateSplitRule('rule-1', validInput);

            expect(result).toEqual({ success: true });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                mockSession, 'splitRouteRules', 'rule-1', 'UPDATE', expect.anything()
            );
        });
    });

    // ---------- deleteSplitRule ----------
    describe('deleteSplitRule', () => {
        it('规则不存在时应抛出错误', async () => {
            mockDb.query.splitRouteRules.findFirst.mockResolvedValueOnce(null);

            const { deleteSplitRule } = await import('../rules');
            await expect(deleteSplitRule('non-exist')).rejects.toThrow('规则不存在或无权操作');
        });

        it('应成功删除规则并记录审计日志', async () => {
            mockDb.query.splitRouteRules.findFirst.mockResolvedValueOnce({ id: 'rule-1' });
            mockDb.where.mockResolvedValueOnce(undefined);

            const { deleteSplitRule } = await import('../rules');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await deleteSplitRule('rule-1');

            expect(result).toEqual({ success: true });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                mockSession, 'splitRouteRules', 'rule-1', 'DELETE'
            );
        });
    });

    // ---------- getAllSuppliers ----------
    describe('getAllSuppliers', () => {
        it('应返回当前租户的供应商列表', async () => {
            const mockSuppliers = [
                { id: 's-1', name: '供应商A', supplierNo: 'SUP-001' },
                { id: 's-2', name: '供应商B', supplierNo: 'SUP-002' },
            ];
            // db.select({...}).from().where() => resolved
            mockDb.where.mockResolvedValueOnce(mockSuppliers);

            const { getAllSuppliers } = await import('../rules');
            const result = await getAllSuppliers();

            expect(result).toEqual(mockSuppliers);
            expect(mockDb.select).toHaveBeenCalled();
        });
    });
});
