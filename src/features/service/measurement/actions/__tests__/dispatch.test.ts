import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchMeasureTask } from '../mutations';
import { MeasurementService } from '@/services/measurement.service';
import { AuditService } from '@/shared/lib/audit-service';

const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_WORKER_ID = '660e8400-e29b-41d4-a716-446655440000';
const MOCK_TENANT_ID = 'tenant-1';

// Mock dependencies
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/services/measurement.service', () => ({
    MeasurementService: {
        dispatchTask: vi.fn()
    }
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn()
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// Mock drizzle schema
vi.mock('@/shared/api/db', () => ({ db: { update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([]) })) })) })) } }));

vi.mock('@/shared/api/schema', () => ({
    measureTasks: {},
    measureTaskSplits: {}
}));

describe('Measurement Action: dispatchMeasureTask', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth, checkPermission } = await import('@/shared/lib/auth');
        (auth as any).mockResolvedValue({
            user: { id: 'user-1', tenantId: MOCK_TENANT_ID, name: 'Test User' }
        });
        (checkPermission as any).mockResolvedValue(true);
    });

    it('should dispatch a task successfully', async () => {
        const scheduledAt = new Date().toISOString();
        const input = {
            id: VALID_TASK_ID,
            workerId: VALID_WORKER_ID,
            scheduledAt
        };

        const result = await dispatchMeasureTask(input);

        expect(result.success).toBe(true);
        expect(MeasurementService.dispatchTask).toHaveBeenCalledWith(
            VALID_TASK_ID,
            VALID_WORKER_ID,
            expect.any(Date),
            'user-1',
            MOCK_TENANT_ID
        );

        expect(AuditService.recordFromSession).toHaveBeenCalledWith(
            expect.any(Object),
            'measure_tasks',
            VALID_TASK_ID,
            'UPDATE',
            expect.objectContaining({
                changed: expect.objectContaining({
                    status: 'DISPATCHED'
                })
            })
        );
    });

    it('should fail if unauthorized (no session)', async () => {
        const { auth } = await import('@/shared/lib/auth');
        (auth as any).mockResolvedValue(null);

        await expect(dispatchMeasureTask({
            id: VALID_TASK_ID,
            workerId: VALID_WORKER_ID,
            scheduledAt: new Date().toISOString()
        })).rejects.toThrow('未授权');
    });

    it('should fail if missing permission', async () => {
        const { checkPermission } = await import('@/shared/lib/auth');
        (checkPermission as any).mockImplementation(() => {
            throw new Error('Permission denied');
        });

        await expect(dispatchMeasureTask({
            id: VALID_TASK_ID,
            workerId: VALID_WORKER_ID,
            scheduledAt: new Date().toISOString()
        })).rejects.toThrow('Permission denied');
    });

    it('should fail with invalid input (wrong UUID)', async () => {
        await expect(dispatchMeasureTask({
            id: 'not-a-uuid',
            workerId: VALID_WORKER_ID,
            scheduledAt: new Date().toISOString()
        })).rejects.toThrow('无效的参数');
    });

    it('should fail with invalid date', async () => {
        await expect(dispatchMeasureTask({
            id: VALID_TASK_ID,
            workerId: VALID_WORKER_ID,
            scheduledAt: 'not-a-date'
        })).rejects.toThrow('无效的参数');
    });

    it('should propagate errors from MeasurementService', async () => {
        (MeasurementService.dispatchTask as any).mockRejectedValue(new Error('测量费未结算'));

        await expect(dispatchMeasureTask({
            id: VALID_TASK_ID,
            workerId: VALID_WORKER_ID,
            scheduledAt: new Date().toISOString()
        })).rejects.toThrow('测量费未结算');
    });
});
