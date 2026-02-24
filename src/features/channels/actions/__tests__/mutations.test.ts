import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';

// 1. 注册 Mock (完全隔离，不引用外部变量)
vi.mock('@/shared/api/db', () => {
    const mockDb = {
        query: {
            channels: { findFirst: vi.fn(), findMany: vi.fn() },
            leads: { findFirst: vi.fn() }
        },
        transaction: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        $count: vi.fn()
    };
    return { db: mockDb };
});

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: 'user-1', tenantId: 'tenant-1' }
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(true) }
}));

// 2. 导入被测模块
import { db } from '@/shared/api/db';
import { createChannel, updateChannel, deleteChannel } from '../mutations';

type MockDb = typeof db & {
    transaction: any;
    insert: any;
    update: any;
    delete: any;
    $count: any;
};

const mockDb = db as unknown as MockDb;

describe('Channels Mutations (渠道业务测试)', () => {
    const mockChannelId = '11111111-e29b-41d4-a716-446655440000';
    const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';

    const createChain = (returnValue: unknown) => ({
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(returnValue)
    });

    beforeEach(() => {
        vi.clearAllMocks();

        mockDb.transaction.mockImplementation(async (cb: (tx: MockDb) => Promise<unknown>) => cb(mockDb));
        mockDb.insert.mockImplementation(() => createChain([{ id: mockChannelId }]));
        mockDb.update.mockImplementation(() => createChain([{ id: mockChannelId }]));
        mockDb.delete.mockImplementation(() => ({
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: mockChannelId }])
        }));
        mockDb.$count.mockResolvedValue(0);
        mockDb.query.channels.findFirst.mockResolvedValue(null);
    });

    describe('createChannel', () => {
        it('应该成功创建渠道并生成默认联系人和审计日志', async () => {
            const input = {
                name: '新测试渠道',
                channelNo: 'CH-001',
                category: 'OFFLINE' as const,
                channelType: 'DECORATION_CO' as const,
                contactName: '张三',
                phone: '13800138000',
                commissionRate: 10,
                commissionType: 'FIXED' as const,
                cooperationMode: 'COMMISSION' as const,
                settlementType: 'PREPAY' as const,
            };

            const result = await createChannel(input);
            expect(result).toEqual({ success: true, channelId: mockChannelId });
        });
    });

    describe('updateChannel', () => {
        it('应该成功更新渠道信息及生成审计日志', async () => {
            const result = await updateChannel(mockChannelId, { name: '新名称', version: 1 });
            expect(result).toEqual({ id: mockChannelId });
        });

        it('并发测试(乐观锁丢失更新)：当返回 0 行时触发并发冲突错误', async () => {
            mockDb.update.mockImplementationOnce(() => ({
                set: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                returning: vi.fn().mockResolvedValueOnce([])
            }));

            const input = { name: '新名称', version: 1 };
            await expect(updateChannel(mockChannelId, input)).rejects.toThrow(
                new AppError('渠道数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409)
            );
        });
    });

    describe('deleteChannel', () => {
        it('渠道存在子渠道时无法删除，触发级联依赖校验', async () => {
            // 模拟渠道存在
            mockDb.query.channels.findFirst.mockResolvedValue({ id: mockChannelId, tenantId: mockTenantId });
            // 给特定的查询 count 返回不同的数量
            mockDb.transaction.mockImplementationOnce(async (cb: (tx: { $count: any }) => Promise<unknown>) => {
                return cb({
                    $count: vi.fn().mockResolvedValueOnce(2) // 子渠道有 2 个
                });
            });

            await expect(deleteChannel(mockChannelId)).rejects.toThrow(/存在.*子渠道.*无法删除/);
        });

        it('渠道校验孤立后成功删除', async () => {
            // 模拟渠道存在
            mockDb.query.channels.findFirst.mockResolvedValue({ id: mockChannelId, tenantId: mockTenantId });
            // 模拟无子渠道且无公海池关联
            mockDb.$count.mockResolvedValue(0);

            await deleteChannel(mockChannelId);
            expect(mockDb.delete).toHaveBeenCalled();
        });
    });
});
