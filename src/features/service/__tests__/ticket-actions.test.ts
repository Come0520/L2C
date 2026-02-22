import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getServiceTickets, updateTicketStatus } from '../actions/ticket-actions';

// --- 1. 统一声明 Mock 变量 ---
const {
    mockUserId,
    mockTenantId,
    mockRevalidatePath,
    mockOrderBy,
    mockCountWhere,
    mockUpdateSet,
    mockUpdateWhere,
    mockLoggerError
} = vi.hoisted(() => {
    return {
        mockUserId: 'user-id-service',
        mockTenantId: 'tenant-id-123',
        mockRevalidatePath: vi.fn(),
        // 数据查询链的最终方法
        mockOrderBy: vi.fn(),
        // 计数查询链的最终方法
        mockCountWhere: vi.fn(),
        mockUpdateSet: vi.fn().mockReturnThis(),
        mockUpdateWhere: vi.fn(),
        mockLoggerError: vi.fn()
    };
});

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
            // 新增：模拟我们加上的防御性查询 (如果是 'ticket-closed-123' 则返回 CLOSED)
            query: {
                afterSalesTickets: {
                    findFirst: vi.fn().mockImplementation(async ({ where }) => {
                        // 使用非常简单的探测，测试用例传递了 ticket-closed-123 来测试拦截
                        // 实际在 where 里的具体解析有点复杂，这里简单使用返回即可，被专门测试覆盖的可以 mockResolvedValueOnce
                        return { status: 'PENDING' }; // 默认通过
                    })
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
                set: mockUpdateSet,
                where: mockUpdateWhere
            }))
        }
    };
});

vi.mock('next/cache', () => ({
    revalidatePath: mockRevalidatePath,
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
            expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({
                status: 'PROCESSING',
                resolution: 'Resolving issue'
            }));
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
            expect(mockUpdateSet).not.toHaveBeenCalled();
        });

        it('应当拦截对已关闭工单的再次状态流转操作', async () => {
            // 利用 vitest 修改当前文件的 db mock 行为（更安全）
            const { db } = await import('@/shared/api/db');
            vi.mocked(db.query.afterSalesTickets.findFirst).mockResolvedValueOnce({ status: 'CLOSED' });

            const result = await updateTicketStatus('ticket-closed-123', 'PROCESSING');

            expect(result.success).toBe(false);
            expect(result.error).toContain('已关闭');
            expect(mockUpdateSet).not.toHaveBeenCalled();
        });
    });
});
