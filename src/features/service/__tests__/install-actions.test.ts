import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getInstallers, dispatchInstallTask, getInstallTasks } from '../actions/install-actions';

// --- 1. 统一在作用域外预声明 Mock 变量 (使用 vi.hoisted 解决提升问题) ---
const {
    mockUserId,
    mockTenantId,
    mockInstallerId,
    mockTaskId,
    mockUsersExecute,
    mockTasksExecute,
    mockUpdateSet,
    mockUpdateWhere,
    mockRevalidatePath
} = vi.hoisted(() => {
    return {
        mockUserId: 'user-id-dispatcher',
        mockTenantId: 'tenant-id-123',
        mockInstallerId: 'installer-id-456',
        mockTaskId: 'install-task-789',
        mockUsersExecute: vi.fn(),
        mockTasksExecute: vi.fn(),
        mockUpdateSet: vi.fn().mockReturnThis(),
        mockUpdateWhere: vi.fn(),
        mockRevalidatePath: vi.fn()
    };
});

// --- 2. 注入 Mock 依赖 ---
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockImplementation(() => ({
        user: { id: mockUserId, tenantId: mockTenantId }
    })),
    checkPermission: vi.fn().mockImplementation(async () => {
        // Mock permission pass by default
    })
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: { findMany: mockUsersExecute, findFirst: mockUsersExecute },
            installTasks: { findMany: mockTasksExecute },
        },
        update: vi.fn(() => ({
            set: mockUpdateSet,
            where: mockUpdateWhere
        }))
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: mockRevalidatePath,
    // Provide a simple bypass for unstable_cache
    unstable_cache: (cb: any) => cb
}));

describe('Service Feature - Install Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getInstallers', () => {
        it('should retrieve installers for the current tenant', async () => {
            const mockInstallers = [
                { id: mockInstallerId, name: 'Installer A', role: 'INSTALLER' }
            ];
            mockUsersExecute.mockResolvedValueOnce(mockInstallers);

            const result = await getInstallers();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockInstallers);
            expect(mockUsersExecute).toHaveBeenCalled(); // Cache bypasses to execute in tests
        });

        it('should handle errors gracefully', async () => {
            mockUsersExecute.mockRejectedValueOnce(new Error('DB Error'));

            const result = await getInstallers();

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
        });
    });

    describe('dispatchInstallTask', () => {
        it('should dispatch an install task and update status', async () => {
            mockUsersExecute.mockResolvedValueOnce({ id: mockInstallerId }); // Mock 师傅存在
            mockUpdateWhere.mockResolvedValueOnce([] as any); // mock successful update result

            const payload = {
                taskId: mockTaskId,
                installerId: mockInstallerId,
                scheduledDate: '2024-05-15T00:00:00.000Z',
                scheduledTimeSlot: 'MORNING'
            };

            const result = await dispatchInstallTask(payload);

            expect(result.success).toBe(true);
            expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({
                installerId: mockInstallerId,
                scheduledTimeSlot: 'MORNING',
                status: 'PENDING_ACCEPT',
                dispatcherId: mockUserId
            }));
            expect(mockRevalidatePath).toHaveBeenCalledWith('/projects');
            expect(mockRevalidatePath).toHaveBeenCalledWith(`/projects/${mockTaskId}`);
        });

        it('should reject if permission check fails', async () => {
            const { checkPermission } = await import('@/shared/lib/auth');
            vi.mocked(checkPermission).mockRejectedValueOnce(new Error('Forbidden'));

            const result = await dispatchInstallTask({
                taskId: mockTaskId,
                installerId: mockInstallerId,
                scheduledDate: '2024-05-15T00:00:00.000Z',
                scheduledTimeSlot: 'MORNING'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Dispatch Failed');
        });

        it('should reject if assigned worker is strictly not found or unavailable', async () => {
            // DB 层面没有搜到这个给定的 installerId
            mockUsersExecute.mockResolvedValueOnce(null);

            const result = await dispatchInstallTask({
                taskId: mockTaskId,
                installerId: 'invalid-installer',
                scheduledDate: '2024-05-15T00:00:00.000Z',
                scheduledTimeSlot: 'MORNING'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
            expect(mockUpdateSet).not.toHaveBeenCalled();
        });
    });

    describe('getInstallTasks', () => {
        it('should return install tasks with filters', async () => {
            const mockTasks = [{ id: mockTaskId, taskNo: 'T-100', status: 'PENDING_ACCEPT' }];
            mockTasksExecute.mockResolvedValueOnce(mockTasks);

            const result = await getInstallTasks({ status: 'PENDING_ACCEPT', search: 'T-' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTasks);
            expect(mockTasksExecute).toHaveBeenCalled();
        });
    });
});
