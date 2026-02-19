import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getMeasureTasks, getMeasureTaskById, getAvailableWorkers } from '../queries';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn(),
        query: {
            measureTasks: {
                findFirst: vi.fn(),
            },
            users: {
                findMany: vi.fn(),
            }
        }
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

// Mock Next.js and React cache
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
    revalidateTag: vi.fn(),
}));

vi.mock('react', () => ({
    cache: vi.fn((fn) => fn),
}));

describe('Measurement Queries', () => {
    const mockSession = { user: { id: 'user-1', tenantId: 'tenant-1' } };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as unknown as Mock).mockResolvedValue(mockSession);
    });

    describe('getMeasureTasks', () => {
        it('should return tasks with pagination', async () => {
            const mockTasks = [
                {
                    id: 'task-1',
                    measureNo: 'M-001',
                    status: 'PENDING',
                    scheduledAt: new Date('2023-01-02'),
                    createdAt: new Date('2023-01-01'),
                    customer: { name: 'John', phone: '123' },
                    lead: { community: 'Comm', address: 'Addr' },
                    assignedWorker: { id: 'w-1', name: 'Worker' }
                }
            ];

            // Mocks that return 'this' for chaining
            // We need a fresh chain object for each call to avoid stale state if reused
            const dataChain = {
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                offset: vi.fn().mockResolvedValue(mockTasks)
            };

            const countChain = {
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ count: 10 }])
            };

            (db.select as unknown as Mock)
                .mockReturnValueOnce(dataChain)
                .mockReturnValueOnce(countChain);

            const result = await getMeasureTasks({ page: 1, pageSize: 10 });

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(10);
            expect(result.data?.[0]?.scheduledAt).toBe(mockTasks[0].scheduledAt.toISOString());

            // Verify correct method calls on the chain
            expect(dataChain.offset).toHaveBeenCalledWith(0);
            expect(dataChain.limit).toHaveBeenCalledWith(10);
        });

        it('should handle errors gracefully', async () => {
            (db.select as unknown as Mock).mockImplementation(() => {
                throw new Error('DB Error');
            });

            const result = await getMeasureTasks({});
            expect(result.success).toBe(false);
            expect(result.error).toBe('获取列表失败');
        });
    });

    describe('getMeasureTaskById', () => {
        it('should return task details when found', async () => {
            const mockTask = { id: 'task-1', tenantId: 'tenant-1' };
            (db.query.measureTasks.findFirst as unknown as Mock).mockResolvedValue(mockTask);

            const result = await getMeasureTaskById('task-1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTask);
        });

        it('should return error when task not found', async () => {
            (db.query.measureTasks.findFirst as unknown as Mock).mockResolvedValue(null);

            const result = await getMeasureTaskById('task-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('任务不存在或无权访问');
        });
    });

    describe('getAvailableWorkers', () => {
        it('should return filtered workers', async () => {
            const mockWorkers = [{ id: 'w-1', name: 'Worker', role: 'WORKER' }];
            (db.query.users.findMany as unknown as Mock).mockResolvedValue(mockWorkers);

            const result = await getAvailableWorkers();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockWorkers);
        });
    });
});
