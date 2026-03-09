import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInstallWorkersAction } from '../actions';

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: 'admin-1', tenantId: 'tenant-1', role: 'ADMIN' },
    }),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('@/shared/services/file-service', () => ({
    fileService: { uploadFile: vi.fn() },
}));

vi.mock('@/env.mjs', () => ({
    env: { OSS_REGION: 'oss-cn-hangzhou' },
}));

const { mockDbQuery, mockSelect, mockFrom, mockWhere, mockGroupBy } = vi.hoisted(() => {
    const mockGroupBy = vi.fn();
    const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    const mockDbQuery = {
        findMany: vi.fn(),
    };

    return { mockGroupBy, mockWhere, mockFrom, mockSelect, mockDbQuery };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: { users: mockDbQuery },
        select: mockSelect,
    },
}));

vi.mock('drizzle-orm', async () => {
    const actual = await vi.importActual('drizzle-orm');
    return {
        ...actual,
        eq: vi.fn(),
        and: vi.fn(),
        or: vi.fn(),
        asc: vi.fn(),
        count: vi.fn(),
    };
});

describe('TDD: getInstallWorkersAction (Workload 查询验证)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. 如果不传入日期，仅返回工人的基本信息', async () => {
        mockDbQuery.findMany.mockResolvedValue([
            { id: 'worker-1', name: 'Worker A', dailyTaskLimit: 3 },
        ]);

        const result = await getInstallWorkersAction();

        expect(result.success).toBe(true);
        // 不应调用动态查询
        expect(mockSelect).not.toHaveBeenCalled();
        expect(result.data?.[0]?.name).toBe('Worker A');
        expect((result.data?.[0] as any).currentTaskCount).toBeUndefined();
    });

    it('2. 如果传入日期，应附加当日负载数据并标出超载', async () => {
        mockDbQuery.findMany.mockResolvedValue([
            { id: 'worker-1', name: 'Worker A', dailyTaskLimit: 3 },
            { id: 'worker-2', name: 'Worker B', dailyTaskLimit: 1 },
        ]);

        mockGroupBy.mockResolvedValue([
            { installerId: 'worker-1', taskCount: 2 },
            { installerId: 'worker-2', taskCount: 1 },
        ]);

        const result = await getInstallWorkersAction('2024-05-20');

        expect(result.success).toBe(true);
        expect(mockSelect).toHaveBeenCalled();

        const data = result.data as any[];
        // Worker A 配额 3，当前 2 -> 未满 
        expect(data[0].currentTaskCount).toBe(2);
        expect(data[0].isFullyLoaded).toBe(false);

        // Worker B 配额 1，当前 1 -> 满载
        expect(data[1].currentTaskCount).toBe(1);
        expect(data[1].isFullyLoaded).toBe(true);
    });
});
