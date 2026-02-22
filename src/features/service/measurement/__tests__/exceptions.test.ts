import { describe, it, expect, vi, beforeEach } from 'vitest';
import { splitMeasureTask } from '../actions/mutations';

const { mockDb, mockAuth } = vi.hoisted(() => ({
    mockDb: {
        transaction: vi.fn(async (cb) => cb({
            query: {
                measureTasks: {
                    findFirst: vi.fn(),
                }
            },
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'new-1' }]),
        })),
    },
    mockAuth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({ db: mockDb }));
vi.mock('@/shared/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/shared/lib/audit-service', () => ({ AuditService: { recordFromSession: vi.fn() } }));
vi.mock('../utils', () => ({ generateMeasureNo: vi.fn().mockResolvedValue('MNT-123') }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

describe('Measurement Exception Scenarios', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'u1', tenantId: 't1' } });
    });

    it('拆分任务时如果原任务已完成应该抛出错误', async () => {
        (mockDb.transaction as any).mockImplementationOnce(async (cb: (tx: any) => Promise<unknown>) => cb({
            query: {
                measureTasks: {
                    findFirst: vi.fn().mockResolvedValue({ id: 'old-1', status: 'COMPLETED' })
                }
            }
        }));

        const result = await splitMeasureTask({
            originalTaskId: '550e8400-e29b-41d4-a716-446655440001', // 有效UUID
            splits: [
                { category: 'CURTAIN', laborFee: 100 },
                { category: 'WALLPAPER', laborFee: 50 }, // 必须至少2个才能通过schema
            ],
            reason: 'Test split'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('已完成任务不可拆分');
    });

    it('拆分任务时若原任务不存在应返回错误', async () => {
        // 创建一个全新的 Mock tx 对象
        const mockTx = {
            query: {
                measureTasks: {
                    findFirst: vi.fn().mockResolvedValue(null)
                }
            },
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
        };

        (mockDb.transaction as any).mockImplementationOnce(async (cb: (tx: any) => Promise<unknown>) => cb(mockTx));

        const result = await splitMeasureTask({
            originalTaskId: '550e8400-e29b-41d4-a716-446655440099', // 有效UUID，但DB返回null
            splits: [
                { category: 'CURTAIN', laborFee: 100 },
                { category: 'WALLPAPER', laborFee: 100 }
            ],
            reason: 'Missing original'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('原任务不存在');
    });
});
