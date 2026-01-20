import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rejectMeasureTask } from '../reject';

const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';

// Mock dependencies
const { mockDbQuery, mockDbUpdate } = vi.hoisted(() => {
    const VALID_TASK_ID_MOCK = '550e8400-e29b-41d4-a716-446655440000';
    return {
        mockDbQuery: {
            measureTasks: {
                findFirst: vi.fn()
            }
        },
        mockDbUpdate: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: VALID_TASK_ID_MOCK }]) // Simulating successful update
                })
            })
        })
    };
});

// Mock auth to prevent next-auth import issues
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(async (cb) => {
            return await cb({
                query: mockDbQuery,
                update: mockDbUpdate,
            });
        })
    }
}));


vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

describe('Measurement Action: rejectMeasureTask', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        // Mock authorized session
        const { auth } = await import('@/shared/lib/auth');
        (auth as any).mockResolvedValue({
            user: { id: 'user-1', tenantId: 'tenant-1' }
        });
    });

    it('should reject a task successfully and reset status to PENDING', async () => {
        // Setup
        const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';
        const taskMock = {
            id: VALID_TASK_ID,
            status: 'PENDING_CONFIRM',
            rejectCount: 0,
            measureNo: 'M-001'
        };
        mockDbQuery.measureTasks.findFirst.mockResolvedValue(taskMock);

        // Execute
        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'Size wrong' });

        // Assert
        expect(result.success).toBe(true); // Action executed successfully
        expect(result.data?.success).toBe(true); // Business logic success

        expect(mockDbUpdate).toHaveBeenCalled();
        expect(mockDbUpdate().set).toHaveBeenCalledWith(expect.objectContaining({
            status: 'PENDING',
            rejectCount: 1,
            rejectReason: 'Size wrong'
        }));
    });

    it('should fail if task does not exist', async () => {
        mockDbQuery.measureTasks.findFirst.mockResolvedValue(null);

        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'reason' });

        expect(result.success).toBe(true); // Action executed
        expect(result.data?.success).toBe(false); // Logic failed
        expect(result.data?.error).toContain('任务不存在');
    });

    it('should fail if task is CANCELLED', async () => {
        mockDbQuery.measureTasks.findFirst.mockResolvedValue({
            id: VALID_TASK_ID,
            status: 'CANCELLED',
            rejectCount: 0
        });

        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'reason' });

        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(false);
        expect(result.data?.error).toContain('无法驳回');
    });

    it('should trigger warning when reject count reaches threshold (3)', async () => {
        // Mock console.warn to verify side effect
        const consoleSpy = vi.spyOn(console, 'warn');

        const taskMock = {
            id: VALID_TASK_ID,
            status: 'PENDING_CONFIRM',
            rejectCount: 2, // 2 + 1 = 3
            measureNo: 'M-001'
        };
        mockDbQuery.measureTasks.findFirst.mockResolvedValue(taskMock);

        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'Bad quality' });

        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(true); // Logic success

        // Check update using set payload
        // Note: mockDbUpdate usage above needs access to the 'set' call args
        // Since we chained mocks, we can inspect the chain or the initial spy if properly exposed.
        // We exposed mockDbUpdate returning an object with set.

        expect(mockDbUpdate).toHaveBeenCalled();

        // Accessing the result of the first call
        // mockDbUpdate() logic: 
        // We need to inspect the RETURN value of mockDbUpdate(), which is the update builder.
        // Or inspect calls to `set`.
        // The mock setup: `mockDbUpdate: vi.fn().mockReturnValue({ set: vi.fn()... })`
        // Inspecting: `mockDbUpdate.mock.results[0].value.set`

        const updateBuilder = mockDbUpdate.mock.results[0].value;
        const setSpy = updateBuilder.set;
        const setCall = setSpy.mock.calls[0][0];

        expect(setCall.rejectCount).toBe(3);

        // Verify warning message in result
        expect(result.data?.message).toContain('介入'); // "已通知店长介入"

        // Verify console warn
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('rejected 3 times'));
    });
});
