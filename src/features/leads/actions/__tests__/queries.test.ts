/**
 * Leads 模块 Server Actions 集成测试 (Queries)
 *
 * 覆盖范围：
 * - getLeads (列表分页与筛选)
 * - getLeadById (单据详情)
 * - getLeadTimeline (时间线记录)
 * - getChannels (渠道列表)
 * - getSalesUsers (销售列表)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

// ── Mock Db ──
const mockDb = createMockDb(['leads', 'leadActivities', 'marketChannels', 'users']);

// Mock QueryBuilder for pagination/complex queries
const mockQueryBuilder = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([{ value: 1 }]),
    groupBy: vi.fn().mockReturnThis(),
    then: function (resolve: any) {
        resolve([{ value: 1 }]);
    }
};

mockDb.select = vi.fn().mockReturnValue(mockQueryBuilder);
mockDb.orderBy = mockQueryBuilder.orderBy;

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb), // 穿透 cache 直接执行回调
    revalidateTag: vi.fn(),
}));

// ── 测试套件 ──
describe('Lead Queries (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
    });

    describe('getLeads', () => {
        it('应当返回分页的线索数据并支持状态过滤', async () => {
            mockDb.query.leads.findMany.mockResolvedValue([
                { id: 'lead-1', customerName: '张三', status: 'FOLLOWING_UP' }
            ]);

            const { getLeads } = await import('../queries');
            const result = await getLeads({
                page: 1,
                pageSize: 10,
                status: ['FOLLOWING_UP']
            });

            expect(mockDb.query.leads.findMany).toHaveBeenCalled();
            expect(result.data).toHaveLength(1);
            expect(result.page).toBe(1);
            expect(result.total).toBe(1); // 依赖 mockDb.select 的 count 结果
        });

        it('未登录时应抛出错误', async () => {
            const { auth } = await import('@/shared/lib/auth');
            vi.mocked(auth).mockResolvedValue(null);

            const { getLeads } = await import('../queries');
            await expect(getLeads({})).rejects.toThrow('Unauthorized');
        });
    });

    describe('getLeadById', () => {
        it('应当返回存在的线索详情', async () => {
            mockDb.query.leads.findFirst.mockResolvedValue({
                id: 'lead-1',
                customerName: '李四'
            });

            const { getLeadById } = await import('../queries');
            const result = await getLeadById({ id: 'lead-1' });

            expect(result).not.toBeNull();
            expect(result?.customerName).toBe('李四');
            expect(mockDb.query.leads.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.anything() // 包含 tenantId 的 and()
                })
            );
        });

        it('未找到线索时返回 null', async () => {
            mockDb.query.leads.findFirst.mockResolvedValue(null);

            const { getLeadById } = await import('../queries');
            const result = await getLeadById({ id: 'not-exist' });

            expect(result).toBeNull();
        });
    });

    describe('getLeadTimeline', () => {
        it('应当必须验证线索归属于当前租户才能返回活动记录', async () => {
            // 首先验证线索
            mockDb.query.leads.findFirst.mockResolvedValue({ id: 'lead-1' });
            // 然后获取记录
            mockDb.query.leadActivities.findMany.mockResolvedValue([
                { id: 'act-1', type: 'PHONE_CALL' }
            ]);

            const { getLeadTimeline } = await import('../queries');
            const result = await getLeadTimeline({ leadId: 'lead-1' });

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('PHONE_CALL');
            expect(mockDb.query.leads.findFirst).toHaveBeenCalled();
            expect(mockDb.query.leadActivities.findMany).toHaveBeenCalled();
        });

        it('如果线索不属于当前租户则抛出错误', async () => {
            mockDb.query.leads.findFirst.mockResolvedValue(null);

            const { getLeadTimeline } = await import('../queries');

            await expect(getLeadTimeline({ leadId: 'lead-1' })).rejects.toThrow('Lead not found or access denied');
            expect(mockDb.query.leadActivities.findMany).not.toHaveBeenCalled();
        });
    });

    describe('getChannels', () => {
        it('应当返回渠道列表', async () => {
            mockDb.query.marketChannels.findMany.mockResolvedValue([
                { id: 'ch-1', name: '线上广告' }
            ]);

            const { getChannels } = await import('../queries');
            const result = await getChannels();

            expect(result).toHaveLength(1);
            expect(mockDb.query.marketChannels.findMany).toHaveBeenCalled();
        });
    });

    describe('getSalesUsers', () => {
        it('应当返回同租户下的有效销售人员', async () => {
            mockDb.query.users.findMany.mockResolvedValue([
                { id: 'user-1', name: '销售A' }
            ]);

            const { getSalesUsers } = await import('../queries');
            const result = await getSalesUsers();

            expect(result).toHaveLength(1);
            expect(mockDb.query.users.findMany).toHaveBeenCalled();
        });
    });
});
