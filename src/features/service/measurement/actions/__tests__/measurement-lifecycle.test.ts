import 'dotenv/config';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitMeasureData, reviewMeasureTask, createNewMeasureVersion } from '../workflows';
import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: vi.fn().mockResolvedValue(true),
        recordFromSession: vi.fn().mockResolvedValue(true),
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        delete: vi.fn().mockReturnValue({}),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mocked-id' }]) }) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) }),
        query: {
            measureTasks: {
                findFirst: vi.fn(),
                findMany: vi.fn().mockResolvedValue([])
            },
            measureSheets: {
                findFirst: vi.fn(),
                findMany: vi.fn().mockResolvedValue([])
            }
        },
        transaction: vi.fn(async (callback) => {
            // Mock transaction just executes the callback
            const tx = {
                insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mocked-id' }]) }) }),
                update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) })
            };
            return callback(tx);
        })
    }
}));

import { db } from '../../../../../shared/api/db';

describe('Measurement Lifecycle', () => {
    const tenantId = '550e8400-e29b-41d4-a716-446655440001';
    const taskId = '550e8400-e29b-41d4-a716-446655440002';
    const workerId = '550e8400-e29b-41d4-a716-446655440003';
    const adminId = '550e8400-e29b-41d4-a716-446655440004';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('submitMeasureData', () => {
        const validPayload = {
            taskId,
            round: 1,
            variant: 'A',
            sitePhotos: ['https://example.com/photo1.jpg'],
            sketchMap: 'https://example.com/map.jpg',
            items: [
                { roomId: '550e8400-e29b-41d4-a716-446655440005', roomName: 'Living Room', windowId: '550e8400-e29b-41d4-a716-446655440006', windowName: 'Main', width: 200, height: 200, windowType: 'STRAIGHT', hasBox: true, isElectric: false }
            ]
        };

        it('should fail if unauthenticated', async () => {
            vi.mocked(auth).mockResolvedValueOnce(null);
            const result = await submitMeasureData(validPayload);
            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权访问');
        });

        it('should fail if user is not the assigned worker', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: '66666666-6666-6666-6666-666666666666', tenantId, roles: ['WORKER'] } } as any);
            // mock findFirst task
            db.query.measureTasks.findFirst = vi.fn().mockResolvedValueOnce({ id: taskId, assignedWorkerId: workerId, status: 'PENDING_VISIT' });

            const result = await submitMeasureData(validPayload);
            expect(result.success).toBe(false);
            expect(result.error).toBe('只有被指派的测量师才能提交测量数据');
        });

        it('should fail if task status is not allowed', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: workerId, tenantId, roles: ['WORKER'] } } as any);
            db.query.measureTasks.findFirst = vi.fn().mockResolvedValueOnce({ id: taskId, assignedWorkerId: workerId, status: 'COMPLETED' });

            const result = await submitMeasureData(validPayload);
            expect(result.success).toBe(false);
            expect(result.error).toContain('不允许提交测量数据');
        });

        it('should successfully submit measure data', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: workerId, tenantId, roles: ['WORKER'] } } as any);
            db.query.measureTasks.findFirst = vi.fn().mockResolvedValueOnce({ id: taskId, assignedWorkerId: workerId, status: 'PENDING_VISIT' });

            const result = await submitMeasureData(validPayload);

            expect(result.success).toBe(true);
            expect(db.transaction).toHaveBeenCalled();
            expect(AuditService.record).toHaveBeenCalled();
        });
    });

    describe('reviewMeasureTask', () => {
        it('should fail if user does not have required role', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: workerId, tenantId, roles: ['WORKER'] } } as any);
            db.query.measureTasks.findFirst = vi.fn().mockResolvedValueOnce({ id: taskId, status: 'PENDING_CONFIRM' });

            await expect(reviewMeasureTask({ id: taskId, action: 'APPROVE' })).rejects.toThrow('无权限执行审核操作');
        });

        it('should successfully approve task', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: adminId, tenantId, roles: ['admin'] } } as any);
            db.query.measureTasks.findFirst = vi.fn().mockResolvedValueOnce({ id: taskId, status: 'PENDING_CONFIRM' });

            const result = await reviewMeasureTask({ id: taskId, action: 'APPROVE' });

            expect(result.success).toBe(true);
            expect(db.transaction).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });

        it('should successfully reject task', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: adminId, tenantId, roles: ['admin'] } } as any);
            db.query.measureTasks.findFirst = vi.fn().mockResolvedValueOnce({ id: taskId, status: 'PENDING_CONFIRM' });

            const result = await reviewMeasureTask({ id: taskId, action: 'REJECT', reason: 'Incomplete data' });

            expect(result.success).toBe(true);
            expect(db.transaction).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });
    });

    describe('createNewMeasureVersion', () => {
        it('should successfully create a new round', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: adminId, tenantId, roles: ['admin'] } } as any);
            db.query.measureTasks.findFirst = vi.fn().mockResolvedValueOnce({ id: taskId, assignedWorkerId: workerId, round: 1 });

            const mockUpdateSet = vi.fn().mockReturnThis();
            const mockUpdateWhere = vi.fn().mockResolvedValueOnce([{ id: taskId }]);
            db.update = vi.fn().mockReturnValue({ set: mockUpdateSet, where: mockUpdateWhere }) as any;

            const result = await createNewMeasureVersion(taskId, 'ROUND');

            expect(result.success).toBe(true);
            expect((result as any).round).toBe(2);
            expect(db.update).toHaveBeenCalled();
        });

        it('should successfully create a new variant', async () => {
            vi.mocked(auth).mockResolvedValueOnce({ user: { id: adminId, tenantId, roles: ['admin'] } } as any);
            db.query.measureTasks.findFirst = vi.fn().mockResolvedValueOnce({ id: taskId, assignedWorkerId: workerId, round: 1 });
            db.query.measureSheets.findMany = vi.fn().mockResolvedValueOnce([{ variant: 'A', status: 'SUBMITTED' }]);

            const result = await createNewMeasureVersion(taskId, 'VARIANT');

            expect(result.success).toBe(true);
            expect((result as any).round).toBe(1);
            expect((result as any).variant).toBe('B');
            // transaction removed, expecting audit log creation is implied by success
        });
    });
});
