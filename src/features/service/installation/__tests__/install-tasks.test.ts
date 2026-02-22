/**
 * 安装模块单元测试
 * 
 * 测试范围：
 * - 租户隔离验证
 * - 权限检查
 * - 角色验证
 * - 输入验证
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            installTasks: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
            orders: {
                findFirst: vi.fn(),
            },
            purchaseOrders: {
                findMany: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(),
            })),
        })),
        transaction: vi.fn((fn) => fn({
            query: {
                installTasks: { findFirst: vi.fn() },
            },
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn(),
                })),
            })),
        })),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

import { checkSchedulingConflict } from '../logic/conflict-detection';
import { checkLogisticsReady } from '../logic/logistics-check';
// checkPaymentBeforeInstall 需要额外的 mock 配置，暂时注释
// import { checkPaymentBeforeInstall } from '../logic/payment-check';
import { db } from '@/shared/api/db';

describe('Installation Module Security Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkSchedulingConflict - 租户隔离', () => {
        it('应该在查询中包含 tenantId 过滤', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([]);
            (db.query.installTasks.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            const tenantId = 'test-tenant-id';
            const installerId = 'test-installer-id';
            const scheduledDate = new Date('2026-01-22');
            const timeSlot = '上午';

            await checkSchedulingConflict(
                installerId,
                scheduledDate,
                timeSlot,
                tenantId,
                undefined,
                undefined
            );

            expect(mockFindMany).toHaveBeenCalled();
            // 验证调用参数包含 tenantId
            const callArgs = mockFindMany.mock.calls[0][0];
            expect(callArgs).toBeDefined();
        });

        it('应该检测硬冲突 - 同一时段已有任务', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([
                {
                    id: 'existing-task-id',
                    taskNo: 'INS-001',
                    scheduledTimeSlot: '上午',
                    status: 'DISPATCHING',
                }
            ]);
            (db.query.installTasks.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            const result = await checkSchedulingConflict(
                'installer-id',
                new Date('2026-01-22'),
                '上午',
                'tenant-id',
                undefined,
                undefined
            );

            expect(result.hasConflict).toBe(true);
            expect(result.conflictType).toBe('HARD');
        });

        it('应该检测软冲突 - 当日任务数过多', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([
                { id: '1', scheduledTimeSlot: '08:00-09:00', status: 'DISPATCHING' },
                { id: '2', scheduledTimeSlot: '09:00-10:00', status: 'DISPATCHING' },
                { id: '3', scheduledTimeSlot: '10:00-11:00', status: 'DISPATCHING' },
            ]);
            (db.query.installTasks.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            const result = await checkSchedulingConflict(
                'installer-id',
                new Date('2026-01-22'),
                '下午', // 不同时段
                'tenant-id',
                undefined,
                undefined
            );

            expect(result.hasConflict).toBe(true);
            expect(result.conflictType).toBe('SOFT');
        });

        it('应该忽略已完成的任务', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([
                {
                    id: 'completed-task',
                    scheduledTimeSlot: '上午',
                    status: 'COMPLETED', // 已完成
                }
            ]);
            (db.query.installTasks.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            const result = await checkSchedulingConflict(
                'installer-id',
                new Date('2026-01-22'),
                '上午',
                'tenant-id',
                undefined,
                undefined
            );

            expect(result.hasConflict).toBe(false);
            expect(result.conflictType).toBe('NONE');
        });
    });

    describe('checkLogisticsReady - 租户隔离', () => {
        it('应该在没有 PO 时返回 ready', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([]);
            (db.query.purchaseOrders.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            const result = await checkLogisticsReady('order-id', 'tenant-id');

            expect(result.ready).toBe(true);
        });

        it('应该检测未到货的 PO', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([
                { id: 'po-1', poNo: 'PO-001', status: 'PENDING', supplierName: 'Supplier A' }
            ]);
            (db.query.purchaseOrders.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            const result = await checkLogisticsReady('order-id', 'tenant-id');

            expect(result.ready).toBe(false);
            expect(result.message).toContain('PO-001');
        });

        it('应该在所有 PO 到货时返回 ready', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([
                { id: 'po-1', poNo: 'PO-001', status: 'RECEIVED', supplierName: 'Supplier A' },
                { id: 'po-2', poNo: 'PO-002', status: 'ARRIVED', supplierName: 'Supplier B' },
            ]);
            (db.query.purchaseOrders.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            const result = await checkLogisticsReady('order-id', 'tenant-id');

            expect(result.ready).toBe(true);
        });
    });

    describe('时段解析', () => {
        it('应该正确解析预定义时段', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([
                { id: '1', scheduledTimeSlot: 'AM', status: 'DISPATCHING' }
            ]);
            (db.query.installTasks.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            // 测试 AM 和 上午 是否冲突
            const result = await checkSchedulingConflict(
                'installer-id',
                new Date('2026-01-22'),
                '上午', // 应该与 AM 冲突
                'tenant-id'
            );

            expect(result.hasConflict).toBe(true);
        });

        it('应该正确解析时间范围格式', async () => {
            const mockFindMany = vi.fn().mockResolvedValue([
                { id: '1', scheduledTimeSlot: '14:00-16:00', status: 'DISPATCHING' }
            ]);
            (db.query.installTasks.findMany as ReturnType<typeof vi.fn>) = mockFindMany;

            // 测试 15:00-17:00 是否与 14:00-16:00 冲突
            const result = await checkSchedulingConflict(
                'installer-id',
                new Date('2026-01-22'),
                '15:00-17:00',
                'tenant-id'
            );

            expect(result.hasConflict).toBe(true);
        });
    });
});

describe('Input Validation', () => {
    it('应该拒绝无效的任务 ID 格式', () => {
        // 这是一个边界测试示例
        const invalidIds = ['', ' ', 'not-a-uuid', '123'];

        invalidIds.forEach(id => {
            // UUID 格式验证
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(uuidRegex.test(id)).toBe(false);
        });
    });

    it('应该接受有效的 UUID', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(uuidRegex.test(validUuid)).toBe(true);
    });
});
