/**
 * 客户模块审计日志集成测试
 * 验证 P0 阶段的审计日志埋点是否生效
 */
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { AuditService } from '@/shared/services/audit-service';

// ── Mock 定义 ────────────────────────────

const { mockDbInsert, mockDbUpdate, mockDbDelete, mockDbQuery } = vi.hoisted(() => {
    return {
        mockDbInsert: vi.fn(),
        mockDbUpdate: vi.fn(),
        mockDbDelete: vi.fn(),
        mockDbQuery: {
            customers: { findFirst: vi.fn(), findMany: vi.fn() },
            customerAddresses: { findFirst: vi.fn(), findMany: vi.fn() },
            customerActivities: { findFirst: vi.fn(), findMany: vi.fn() },
        },
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        insert: mockDbInsert,
        update: mockDbUpdate,
        delete: mockDbDelete,
        transaction: vi.fn(async (cb) =>
            cb({
                insert: mockDbInsert,
                update: mockDbUpdate,
                delete: mockDbDelete,
                query: mockDbQuery,
            })
        ),
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn(),
        record: vi.fn(),
        recordFromSession: vi.fn(),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: 'test-user-id', tenantId: 'test-tenant-id' },
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// ── 测试套件 ────────────────────────────

describe('客户模块 Audit Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // 彻底清空 mock 数据结构，防止其他文件留存的污染
        mockDbInsert.mockReset();
        mockDbUpdate.mockReset();
        mockDbDelete.mockReset();
        mockDbQuery.customers.findFirst.mockReset();
        mockDbQuery.customerAddresses.findFirst.mockReset();
        mockDbQuery.customerActivities.findFirst.mockReset();

        // 默认 DB Mock 返回值
        mockDbInsert.mockImplementation(() => ({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
            }),
        }));

        // [Fix] 修复链式调用 Mock
        const mockUpdateChain = {
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'updated-id', address: 'Updated Address' }])
        };
        mockDbUpdate.mockImplementation(() => mockUpdateChain);

        const mockDeleteChain = {
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'deleted-id' }])
        };
        mockDbDelete.mockImplementation(() => mockDeleteChain);

        // 模拟地址操作中的 findFirst
        mockDbQuery.customers.findFirst.mockResolvedValue({ id: 'cust-1', tenantId: 'test-tenant-id' });
        mockDbQuery.customerAddresses.findFirst.mockResolvedValue({
            id: 'addr-1',
            customerId: 'cust-1',
            tenantId: 'test-tenant-id'
        });
    });

    describe('addCustomerAddress', () => {
        it('应在创建地址后记录审计日志', async () => {
            const { addCustomerAddress } = await import('../actions/mutations');

            const validUuid = '123e4567-e89b-12d3-a456-426614174000';
            mockDbQuery.customers.findFirst.mockResolvedValue({ id: validUuid, tenantId: 'test-tenant-id' });

            const result = await addCustomerAddress({
                customerId: validUuid,
                label: '公司',
                province: '北京',
                city: '北京',
                district: '朝阳区',
                community: 'CBD',
                address: 'Test Address',
                isDefault: true,
            });

            expect(result).toBeDefined();

            expect(AuditService.log).toHaveBeenCalledWith(
                expect.anything(), // tx
                expect.objectContaining({
                    tableName: 'customer_addresses',
                    action: 'CREATE',
                    userId: 'test-user-id',
                    details: expect.objectContaining({ customerId: validUuid }),
                })
            );
        });
    });

    describe('updateCustomerAddress', () => {
        it('应在更新地址后记录审计日志', async () => {
            const { updateCustomerAddress } = await import('../actions/mutations');

            await updateCustomerAddress({
                id: 'addr-1',
                address: 'Updated Address',
            });

            expect(AuditService.log).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    tableName: 'customer_addresses',
                    action: 'UPDATE',
                    userId: 'test-user-id',
                    recordId: 'addr-1',
                })
            );
        });
    });

    describe('deleteCustomerAddress', () => {
        it('应在删除地址后记录审计日志', async () => {
            const { deleteCustomerAddress } = await import('../actions/mutations');

            await deleteCustomerAddress('addr-1');

            expect(AuditService.log).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    tableName: 'customer_addresses',
                    action: 'DELETE',
                    recordId: 'addr-1',
                })
            );
        });
    });

    describe('createActivity', () => {
        it('应在创建活动后记录审计日志', async () => {
            const { createActivity } = await import('../actions/activities');

            // Mock insert returning
            mockDbInsert.mockImplementation(() => ({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'activity-1' }]),
                }),
            }));

            // Mock customer check for UUID validation
            // 注意：Activity Schema 校验 customerId 是 UUID。
            // 但我们的 mockDbQuery.customers.findFirst 返回 id: 'cust-1'，这可能在之后用到。
            // Zod 校验的是 input.customerId。所以我传入有效的 UUID 即可。
            const validUuid = '123e4567-e89b-12d3-a456-426614174000';

            // 还需要 Mock findFirst 返回该 customer
            mockDbQuery.customers.findFirst.mockResolvedValue({ id: validUuid, tenantId: 'test-tenant-id' });

            await createActivity({
                customerId: validUuid,
                type: 'VISIT', // 使用有效枚举值
                description: 'Test Activity',
            });

            expect(AuditService.log).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    tableName: 'customer_activities',
                    action: 'CREATE',
                    userId: 'test-user-id',
                    details: expect.objectContaining({ type: 'VISIT' }),
                })
            );
        });
    });
});
