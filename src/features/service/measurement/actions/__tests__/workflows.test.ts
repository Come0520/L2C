import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitMeasureData, reviewMeasureTask } from '../workflows';

const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_TENANT_ID = 'tenant-1';
const MOCK_USER_ID = 'user-1';

// Mock dependencies
const { mockDbQuery, mockDbInsert, mockDbUpdate } = vi.hoisted(() => {
    return {
        mockDbQuery: {
            measureTasks: {
                findFirst: vi.fn()
            }
        },
        mockDbInsert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'sheet-1' }])
            })
        }),
        mockDbUpdate: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue({ success: true })
            })
        })
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        transaction: vi.fn(async (cb) => {
            return await cb({
                insert: mockDbInsert,
                update: mockDbUpdate,
            });
        })
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: vi.fn(),
        recordFromSession: vi.fn()
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

// Mock drizzle schema
vi.mock('@/shared/api/schema', () => ({
    measureTasks: { id: 'id', tenantId: 'tenantId', status: 'status', rejectCount: 'rejectCount', assignedWorkerId: 'assignedWorkerId' },
    measureSheets: { id: 'id', taskId: 'taskId', status: 'status', tenantId: 'tenantId' },
    measureItems: { id: 'id', sheetId: 'sheetId' }
}));

describe('Measurement Workflows', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth } = await import('@/shared/lib/auth');
        (auth as any).mockResolvedValue({
            user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID, roles: ['sales'] }
        });
    });

    describe('submitMeasureData', () => {
        const mockSheetInput = {
            taskId: VALID_TASK_ID,
            round: 1,
            variant: 'A',
            sitePhotos: ['https://example.com/photo.jpg'],
            items: [
                {
                    roomName: 'Living Room',
                    windowType: 'STRAIGHT',
                    width: 100,
                    height: 200,
                    installType: 'TOP',
                    hasBox: false,
                    isElectric: false
                }
            ]
        };

        it('should submit measure data successfully', async () => {
            mockDbQuery.measureTasks.findFirst.mockResolvedValue({
                id: VALID_TASK_ID,
                assignedWorkerId: MOCK_USER_ID,
                status: 'PENDING_VISIT'
            });

            const result = await submitMeasureData(mockSheetInput as any);

            expect(result.success).toBe(true);
            expect(mockDbInsert).toHaveBeenCalled();
            expect(mockDbUpdate).toHaveBeenCalled();
        });

        it('should fail if user is not the assigned worker', async () => {
            mockDbQuery.measureTasks.findFirst.mockResolvedValue({
                id: VALID_TASK_ID,
                assignedWorkerId: 'wrong-user',
                status: 'PENDING_VISIT'
            });

            const result = await submitMeasureData(mockSheetInput as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('只有被指派的测量师才能提交');
        });

        it('should fail if status is not allowed', async () => {
            mockDbQuery.measureTasks.findFirst.mockResolvedValue({
                id: VALID_TASK_ID,
                assignedWorkerId: MOCK_USER_ID,
                status: 'COMPLETED'
            });

            const result = await submitMeasureData(mockSheetInput as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('状态(COMPLETED)不允许提交');
        });
    });

    describe('reviewMeasureTask', () => {
        it('should approve a task successfully', async () => {
            mockDbQuery.measureTasks.findFirst.mockResolvedValue({
                id: VALID_TASK_ID,
                status: 'PENDING_CONFIRM'
            });

            const result = await reviewMeasureTask({ id: VALID_TASK_ID, action: 'APPROVE' });

            expect(result.success).toBe(true);
            expect(mockDbUpdate).toHaveBeenCalled();
        });

        it('should reject a task successfully', async () => {
            mockDbQuery.measureTasks.findFirst.mockResolvedValue({
                id: VALID_TASK_ID,
                status: 'PENDING_CONFIRM'
            });

            const result = await reviewMeasureTask({ id: VALID_TASK_ID, action: 'REJECT', reason: 'Too small' });

            expect(result.success).toBe(true);
            expect(mockDbUpdate).toHaveBeenCalled();
        });

        it('should fail if user has no permission (role mismatch)', async () => {
            const { auth } = await import('@/shared/lib/auth');
            (auth as any).mockResolvedValue({
                user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID, roles: ['worker'] }
            });

            mockDbQuery.measureTasks.findFirst.mockResolvedValue({
                id: VALID_TASK_ID,
                status: 'PENDING_CONFIRM'
            });

            await expect(reviewMeasureTask({ id: VALID_TASK_ID, action: 'APPROVE' })).rejects.toThrow('无权限');
        });
    });
});
