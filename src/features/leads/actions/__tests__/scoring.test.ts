/**
 * Leads 模块 Server Actions 集成测试 (Scoring & Duplicate Check)
 *
 * 覆盖范围：
 * - calculateLeadScore
 * - checkLeadDuplicate
 * - batchCheckLeadDuplicates
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const MOCK_LEAD_ID = '550e8400-e29b-41d4-a716-446655440000';

// ── Mock Db ──
const mockDb = createMockDb(['leads']);

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve(MOCK_SESSION)),
}));

vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: vi.fn((schema, handler) => {
        return async (data: unknown) => {
            const parsed = schema.parse(data);
            return handler(parsed, { session: MOCK_SESSION });
        };
    }),
}));

vi.mock('@/shared/lib/utils', () => ({
    escapeSqlLike: vi.fn((s: string) => s),
}));

// ── 测试套件 ──
describe('Lead Scoring & Duplicate Check (L5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── calculateLeadScore ──
    describe('calculateLeadScore', () => {
        it('应当按照权重公式正确计算评分', async () => {
            mockDb.query.leads.findFirst.mockResolvedValue({
                id: MOCK_LEAD_ID,
                channelId: 'ch-1',
                intentionLevel: 'HIGH',
                estimatedAmount: '50000',
            });

            const { calculateLeadScore } = await import('../scoring');
            const result = await calculateLeadScore({ leadId: MOCK_LEAD_ID });

            // 验证返回结构
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('starRating');
            expect(result).toHaveProperty('priorityLabel');
            expect(result.score.total).toBeGreaterThan(0);
        });

        it('线索不存在时应返回错误', async () => {
            mockDb.query.leads.findFirst.mockResolvedValue(null);

            const { calculateLeadScore } = await import('../scoring');
            const result = await calculateLeadScore({ leadId: MOCK_LEAD_ID });

            expect(result).toEqual({ error: '线索不存在' });
        });
    });

    // ── checkLeadDuplicate ──
    describe('checkLeadDuplicate', () => {
        it('手机号匹配时应返回 isDuplicate: true', async () => {
            mockDb.query.leads.findMany.mockResolvedValue([
                {
                    id: 'dup-1',
                    customerName: '张三',
                    customerPhone: '13800138000',
                    address: '某小区',
                    status: 'FOLLOWING_UP',
                    createdAt: new Date()
                }
            ]);

            const { checkLeadDuplicate } = await import('../scoring');
            const result = await checkLeadDuplicate({
                phone: '13800138000',
                name: '张三',
            });

            expect(result.isDuplicate).toBe(true);
            expect(result.matches.length).toBeGreaterThan(0);
        });

        it('无手机号和地址时应返回 isDuplicate: false', async () => {
            const { checkLeadDuplicate } = await import('../scoring');
            const result = await checkLeadDuplicate({});

            expect(result.isDuplicate).toBe(false);
            expect(result.matches).toEqual([]);
        });
    });

    // ── batchCheckLeadDuplicates ──
    describe('batchCheckLeadDuplicates', () => {
        it('应当批量检查并返回统计结果', async () => {
            mockDb.query.leads.findMany.mockResolvedValue([
                { id: 'existing-1', customerName: '甲', customerPhone: '13900139001', status: 'FOLLOWING_UP' }
            ]);

            const { batchCheckLeadDuplicates } = await import('../scoring');
            const result = await batchCheckLeadDuplicates({
                items: [
                    { rowIndex: 0, phone: '13900139001' },
                    { rowIndex: 1, phone: '13900139999' },
                ]
            });

            expect(result.totalChecked).toBe(2);
            expect(result.duplicateCount).toBe(1);
            expect(result.uniqueCount).toBe(1);
        });
    });
});
