import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';
import { mergeCustomersAction } from '../mutations';

const {
    MOCK_SESSION, mockTenantId, mockUserId, mockPrimaryId, mockSourceId,
    mockDbQuery, mockTxUpdate, mockTxInsert, mockTx, mockDbTransaction
} = vi.hoisted(() => {
    const TNT_ID = '880e8400-e29b-41d4-a716-446655440000';
    const USR_ID = '990e8400-e29b-41d4-a716-446655440000';
    const PRI_ID = 'primary-123';
    const SRC_ID = 'source-123';

    const SESSION = {
        user: { id: USR_ID, tenantId: TNT_ID, roles: ['ADMIN'] }
    };

    const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: PRI_ID }])
    };

    // insert().values().returning()
    const insertChainValues = {
        returning: vi.fn().mockResolvedValue([{ id: 'log-1', primaryCustomerId: PRI_ID }])
    };
    const insertChain = {
        values: vi.fn(() => insertChainValues)
    };

    const tx = {
        update: vi.fn(() => updateChain),
        insert: vi.fn(() => insertChain),
        query: {
            customers: { findFirst: vi.fn(), findMany: vi.fn() },
            customerMergeLogs: { findFirst: vi.fn(), findMany: vi.fn() }
        }
    };

    return {
        MOCK_SESSION: SESSION,
        mockTenantId: TNT_ID,
        mockUserId: USR_ID,
        mockPrimaryId: PRI_ID,
        mockSourceId: SRC_ID,
        mockDbQuery: tx.query,
        mockTxUpdate: updateChain,
        mockTxInsert: insertChain,
        mockTx: tx,
        mockDbTransaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(tx))
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        transaction: mockDbTransaction
    }
}));

vi.mock('@/shared/api/schema', () => ({
    customers: { id: 'customers.id', tenantId: 'customers.tenantId', deletedAt: 'customers.deletedAt', version: 'customers.version' },
    customerMergeLogs: { id: 'cml.id', primaryCustomerId: 'cml.primaryCustomerId' },
    customerAddresses: { id: 'ca.id', customerId: 'ca.customerId', tenantId: 'ca.tenantId', version: 'ca.version' },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(true) }
}));

describe('mergeCustomersAction (合并客户测试)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth, checkPermission } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
        vi.mocked(checkPermission).mockResolvedValue(true);

        // 初始化主客户
        mockDbQuery.customers.findFirst.mockImplementation(async () => {
            return {
                id: mockPrimaryId,
                customerNo: 'C001',
                tenantId: mockTenantId,
                totalOrders: 2,
                totalAmount: '2000',
                version: 1,
                isMerged: false,
                deletedAt: null
            };
        });

        // 初始化源客户
        mockDbQuery.customers.findMany.mockImplementation(async () => {
            return [{
                id: mockSourceId,
                customerNo: 'C002',
                tenantId: mockTenantId,
                totalOrders: 1,
                totalAmount: '1000',
                isMerged: false,
                deletedAt: null
            }];
        });
    });

    it('1/2/3. 分别测出源客户软删除、目标客户总计更新、日志写入成功', async () => {
        // 定制化此 test 里的 tx mock 以追踪 .set() 和 .values() 的参数
        const setMock = vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: mockPrimaryId }])
            })
        });
        const updateMock = vi.fn().mockReturnValue({ set: setMock });

        const valuesMock = vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'merge-log-123' }])
        });
        const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

        mockDbTransaction.mockImplementationOnce(async (cb: (tx: any) => Promise<any>) => {
            return cb({
                update: updateMock,
                insert: insertMock,
                query: mockDbQuery
            });
        });

        const input = {
            targetCustomerId: mockPrimaryId,
            targetCustomerVersion: 1,
            sourceCustomerIds: [mockSourceId],
            fieldPriority: 'PRIMARY' as const,
        };

        const result = await mergeCustomersAction(input, mockUserId);

        expect(mockDbTransaction).toHaveBeenCalled();

        // 验证1: 源客户被软删除状态标记
        expect(setMock).toHaveBeenCalledWith(
            expect.objectContaining({
                isMerged: true,
                deletedAt: expect.any(Date)
            })
        );

        // 验证2: 目标客户 totalOrders 累加至 3 (2+1), totalAmount 累加至 3000 (2000+1000), 并且版本号累加
        expect(setMock).toHaveBeenCalledWith(
            expect.objectContaining({
                totalOrders: 3,
                totalAmount: '3000',
                version: 2
            })
        );

        // 验证3: 合并日志写入
        expect(valuesMock).toHaveBeenCalledWith(
            expect.objectContaining({
                primaryCustomerId: mockPrimaryId,
                mergedCustomerIds: [mockSourceId]
            })
        );

        // 动作返回了最后插入的合并日志
        expect(result).toEqual({ id: 'merge-log-123' });
    });

    it('4. 因为乐观锁(version不匹配)而触发的合并失败拦截', async () => {
        // The mocked primary customer has version: 1
        const input = {
            targetCustomerId: mockPrimaryId,
            targetCustomerVersion: 99, // 版本号不匹配
            sourceCustomerIds: [mockSourceId],
            fieldPriority: 'PRIMARY' as const,
        };

        await expect(mergeCustomersAction(input, mockUserId)).rejects.toThrow(
            new AppError('数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409)
        );

        // 一旦前置拦截，就不会起事务
        expect(mockDbTransaction).not.toHaveBeenCalled();
    });

    it('测试在更新最后阶段丢失更新(返回0行)的情况下的并发错误', async () => {
        // 模拟在 set().where(...).returning() 中返回了空数组，表示条件（特别是version条件）不满足行更新
        const emptyReturningMock = vi.fn().mockResolvedValue([]);
        const setMock = vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: emptyReturningMock
            })
        });
        const updateMock = vi.fn().mockReturnValue({ set: setMock });
        const insertMock = vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'dummy' }]) })
        });

        mockDbTransaction.mockImplementationOnce(async (cb: (tx: any) => Promise<any>) => {
            return cb({
                update: updateMock,
                insert: insertMock,
                query: mockDbQuery
            });
        });

        const input = {
            targetCustomerId: mockPrimaryId,
            targetCustomerVersion: 1, // 前置通过
            sourceCustomerIds: [mockSourceId],
            fieldPriority: 'PRIMARY' as const,
        };

        await expect(mergeCustomersAction(input, mockUserId)).rejects.toThrow(
            new AppError('并发合并失败，数据已被修改', ERROR_CODES.CONCURRENCY_CONFLICT, 409)
        );
    });
});
