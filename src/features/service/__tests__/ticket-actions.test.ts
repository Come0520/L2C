import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getServiceTickets, updateTicketStatus } from '../actions/ticket-actions';

// --- 1. 统一声明 Mock 变量 ---
const {
    mockUserId,
    mockTenantId,
    mockRevalidatePath,
    mockOrderBy,
    mockCountWhere,
    mockUpdateWhere,
    mockLoggerError,
    mockFindFirst,
    mockIsValidTransition,
    mockLogAuditEvent,
} = vi.hoisted(() => {
    return {
        mockUserId: 'user-id-service',
        mockTenantId: 'tenant-id-123',
        mockRevalidatePath: vi.fn(),
        // 数据查询链的最终方法
        mockOrderBy: vi.fn(),
        // 计数查询链的最终方法
        mockCountWhere: vi.fn(),
        mockUpdateWhere: vi.fn(),
        mockLoggerError: vi.fn(),
        // afterSalesTickets.findFirst 的 mock—移入 hoisted 确保 clearAllMocks 后能重设
        mockFindFirst: vi.fn(),
        // isValidTransition mock—移入 hoisted 确保 clearAllMocks 后能重设
        mockIsValidTransition: vi.fn(),
        // logAuditEvent mock—移入 hoisted 确保 clearAllMocks 后能重设
        mockLogAuditEvent: vi.fn(),
    };
});

// 导入 isValidTransition 和 logAuditEvent 的 mock—使用 hoisted 的 mock 函数
vi.mock('@/features/after-sales/logic/state-machine', () => ({
    isValidTransition: mockIsValidTransition, // 使用 hoisted mock°
}));

vi.mock('@/shared/lib/audit-service', () => ({
    logAuditEvent: mockLogAuditEvent, // 使用 hoisted mock
    AuditService: {
        recordFromSession: vi.fn().mockResolvedValue(undefined),
        record: vi.fn().mockResolvedValue(undefined),
    }
}));

// --- 2. 注入 Mock 依赖 ---
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockImplementation(() => ({
        user: { id: mockUserId, tenantId: mockTenantId }
    })),
    checkPermission: vi.fn().mockImplementation(async () => {
        // 默认通过权限检查
    })
}));

vi.mock('@/shared/api/db', () => {
    // 构建完整链式调用: db.select().from().leftJoin().leftJoin().where().limit().offset().orderBy()
    const createSelectChain = () => ({
        from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            offset: vi.fn().mockReturnValue({
                                orderBy: mockOrderBy
                            })
                        })
                    })
                })
            })
        })
    });

    // 计数查询: db.select({ count }).from().leftJoin().where()
    const createCountChain = () => ({
        from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
                where: mockCountWhere
            })
        })
    });

    let selectCallCount = 0;
    return {
        db: {
            // 防御性查询：afterSalesTickets.findFirst
            query: {
                afterSalesTickets: {
                    findFirst: mockFindFirst  // 使用 hoisted 的 mock 函数
                }
            },
            select: vi.fn(() => {
                selectCallCount++;
                // 第一次 select 是数据查询，第二次是计数查询
                if (selectCallCount % 2 === 1) {
                    return createSelectChain();
                } else {
                    return createCountChain();
                }
            }),
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: mockUpdateWhere
                })),
                where: mockUpdateWhere
            })),
            // updateTicketStatus 源码在 db.transaction 内调用 tx.update
            transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
                const tx: any = {
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: mockUpdateWhere
                        }))
                    })),
                    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
                };
                return await cb(tx);
            }),
        }
    };
});

vi.mock('next/cache', () => ({
    revalidatePath: mockRevalidatePath,
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: {
        error: mockLoggerError,
        info: vi.fn(),
        warn: vi.fn()
    }
}));

// 需要 mock schema 相关的 drizzle 导出
vi.mock('@/shared/api/schema', () => ({
    afterSalesTickets: { id: 'id', tenantId: 'tenantId', customerId: 'customerId', orderId: 'orderId', ticketNo: 'ticketNo', description: 'description', status: 'status', createdAt: 'createdAt' },
    customers: { id: 'id', name: 'name' },
    orders: { id: 'id' }
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        AFTER_SALES: { MANAGE: 'after_sales:manage' }
    }
}));

describe('Service Feature - Ticket Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // clearAllMocks 会清除 mock 函数的 calls，但实现需要重新设置
        // 使用 hoisted 中的 mockFindFirst，在 beforeEach 重设默认返回值
        mockFindFirst.mockResolvedValue({ status: 'PENDING' });
        // 重设 isValidTransition 默认返回 true，不领状态转换失败
        mockIsValidTransition.mockReturnValue(true);
        // 重设 logAuditEvent 默认成功
        mockLogAuditEvent.mockResolvedValue(undefined);
    });

    describe('getServiceTickets', () => {
        it('应当使用正确的分页和搜索参数获取工单列表', async () => {
            // Mock 数据查询最终返回
            const mockDataRows = [
                {
                    ticket: { id: 'ticket-1', ticketNo: 'T-001', status: 'PENDING' },
                    customer: { id: 'cust-1', name: 'John Doe' },
                    order: { id: 'order-1' }
                }
            ];
            mockOrderBy.mockResolvedValueOnce(mockDataRows);

            // Mock 计数查询返回
            mockCountWhere.mockResolvedValueOnce([{ count: 1 }]);

            const result = await getServiceTickets({
                page: 2,
                pageSize: 10,
                search: 'John',
                status: 'PENDING'
            });

            expect(result.success).toBe(true);
            expect(result.total).toBe(1);
            expect(result.page).toBe(2);
            expect(result.totalPages).toBe(1);

            // 检查格式化后的数据结构
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toHaveProperty('customer');
            expect(result.data[0].customer!.name).toBe('John Doe');
        });

        it('应当在数据库错误时返回空列表', async () => {
            mockOrderBy.mockRejectedValueOnce(new Error('DB Error'));

            const result = await getServiceTickets();

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
            expect(mockLoggerError).toHaveBeenCalled();
        });
    });

    describe('updateTicketStatus', () => {
        it('应当成功更新工单状态', async () => {
            mockUpdateWhere.mockResolvedValueOnce([]);

            const result = await updateTicketStatus('ticket-123', 'PROCESSING', 'Resolving issue');

            expect(result.success).toBe(true);
            // 验证 revalidatePath 正确调用
            expect(mockRevalidatePath).toHaveBeenCalledWith('/service');
        });

        it('应当在权限检查失败时抛出异常（checkPermission 在 try/catch 之外）', async () => {
            const { checkPermission } = await import('@/shared/lib/auth');
            vi.mocked(checkPermission).mockRejectedValueOnce(new Error('Forbidden'));

            // checkPermission 在 try/catch 块外部调用，异常不会被内部捕获
            // 因此函数直接抛出错误
            await expect(
                updateTicketStatus('ticket-123', 'CLOSED')
            ).rejects.toThrow('Forbidden');

            // 确认数据库操作未被执行
            // mockTransactionCb 未执行，故不验证 update
        });

        it('应当拦截对已关闭工单的再次状态流转操作', async () => {
            // 使用 hoisted 的 mockFindFirst 瓴原和外部一致
            mockFindFirst.mockResolvedValueOnce({ status: 'CLOSED' });

            const result = await updateTicketStatus('ticket-closed-123', 'PROCESSING');

            expect(result.success).toBe(false);
            expect(result.error).toContain('已关闭');
        });
    });
});
