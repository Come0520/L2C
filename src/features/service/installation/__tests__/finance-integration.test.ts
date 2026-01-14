import { describe, it, expect, vi, beforeEach } from 'vitest';
import { confirmInstallation } from '../actions';
import { apStatements } from '@/shared/api/schema';

// Hoisted Mocks
const { mockDbQuery, mockDbInsert, mockDbUpdate, mockSession } = vi.hoisted(() => {
    return {
        mockDbQuery: {
            installTasks: {
                findFirst: vi.fn(),
            },
            apStatements: {
                findFirst: vi.fn(),
            },
            apStatementItems: {
                findFirst: vi.fn(),
            }
        },
        mockDbInsert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'ap-123', apNo: 'AP-20240001' }]),
            })),
        })),
        mockDbUpdate: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve()),
            })),
        })),
        mockSession: {
            user: { id: 'user-1', tenantId: 'tenant-1' }
        }
    };
});

vi.mock('@/shared/api/db', () => {
    const mockDb = {
        query: mockDbQuery,
        insert: mockDbInsert,
        update: mockDbUpdate,
        transaction: vi.fn(async (cb) => {
            const tx = {
                query: mockDbQuery,
                insert: mockDbInsert,
                update: mockDbUpdate,
            };
            return await cb(tx);
        }),
    };
    return { db: mockDb };
});

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve(mockSession)),
    checkPermission: vi.fn().mockReturnValue(true),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('Installation Finance Integration (AP Logic)', () => {
    const taskId = 'task-123';
    const tenantId = 'tenant-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a labor AP record when installation is confirmed', async () => {
        // 1. Mock existing task
        mockDbQuery.installTasks.findFirst.mockResolvedValue({
            id: taskId,
            tenantId,
            status: 'PENDING_CONFIRM',
            orderId: 'order-123',
            assignedWorkerId: 'worker-123',
            laborFee: '100.00'
        });

        // 2. Mock no existing AP
        mockDbQuery.apStatements.findFirst.mockResolvedValue(null);
        mockDbQuery.apStatementItems.findFirst.mockResolvedValue(null);

        // 3. Execute
        const result = await confirmInstallation(undefined, {
            taskId,
            actualLaborFee: 120,
            adjustmentReason: 'Extra work required',
            rating: 5
        });

        // 4. Assertions
        expect(result.success).toBe(true);
        expect(mockDbInsert).toHaveBeenCalled();
        // Check that insert was called with apStatements
        const insertCalls = mockDbInsert.mock.calls;
        expect(insertCalls.length).toBeGreaterThan(0);
        // The first call should be to insert apStatements
        expect(insertCalls[0][0]).toBe(apStatements);
    });
});
