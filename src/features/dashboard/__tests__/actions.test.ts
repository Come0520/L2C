import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardStats } from '../actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

// Mock auth
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

// Mock db
vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ value: 10 }]),
            })),
        })),
    },
}));

// Mock server-action middleware properties
const mockSession = {
    user: {
        id: 'u1',
        tenantId: 't1',
        role: 'ADMIN',
        name: 'Admin User'
    }
};

describe('Dashboard Actions 集成测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as never);
    });

    describe('getDashboardStats', () => {
        it('管理员应能获取全量统计数据', async () => {
            const result = await getDashboardStats({});
            expect(result.success).toBe(true);
            const data = result.data as { role: string; cards: { title: string }[] };
            expect(data.role).toBe('ADMIN');
            expect(data.cards.length).toBeGreaterThan(0);
        });

        it('销售角色应获取个人统计数据', async () => {
            const salesSession = { ...mockSession, user: { ...mockSession.user, role: 'SALES' } };
            vi.mocked(auth).mockResolvedValue(salesSession as never);

            const result = await getDashboardStats({});

            expect(result.success).toBe(true);
            const data = result.data as { role: string; cards: { title: string }[] };
            expect(data.role).toBe('SALES');
            expect(data.cards.find((c) => c.title === '我的线索')).toBeDefined();
        });

        it('数据库异常时应返回错误响应', async () => {
            vi.mocked(db.select as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
                throw new Error('DB_DOWN');
            });

            const result = await getDashboardStats({});
            expect(result.success).toBe(false);
            expect(result.error).toBe('获取统计数据失败');
        });
    });
});
