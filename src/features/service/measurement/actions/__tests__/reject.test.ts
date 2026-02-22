import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rejectMeasureTask } from '../reject';

const VALID_TASK_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_TENANT_ID = 'tenant-1';

// Mock dependencies
const { mockDbQuery, mockDbUpdate } = vi.hoisted(() => {
    const VALID_TASK_ID_MOCK = '550e8400-e29b-41d4-a716-446655440000';
    return {
        mockDbQuery: {
            measureTasks: {
                findFirst: vi.fn()
            },
            users: {
                findMany: vi.fn().mockResolvedValue([]) // 默认无店长
            }
        },
        mockDbUpdate: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: VALID_TASK_ID_MOCK }])
                })
            })
        })
    };
});

// Mock auth
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        insert: vi.fn().mockReturnValue({ values: vi.fn() }),
        transaction: vi.fn(async (cb) => {
            return await cb({
                query: mockDbQuery,
                update: mockDbUpdate,
            });
        })
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// Mock notification service
vi.mock('@/features/notifications/service', () => ({
    notificationService: {
        send: vi.fn().mockResolvedValue({ success: true })
    }
}));

describe('Measurement Action: rejectMeasureTask', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        // Mock 授权会话
        const { auth, checkPermission } = await import('@/shared/lib/auth');
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-1', tenantId: MOCK_TENANT_ID, name: 'Test User' }
        });
        (checkPermission as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    });

    it('should reject a task successfully and reset status to PENDING_VISIT', async () => {
        // 设置 mock 数据（包含 tenantId 以通过租户隔离校验）
        const taskMock = {
            id: VALID_TASK_ID,
            tenantId: MOCK_TENANT_ID, // 必须匹配 Session 中的 tenantId
            status: 'PENDING_CONFIRM',
            rejectCount: 0,
            measureNo: 'M-001'
        };
        mockDbQuery.measureTasks.findFirst.mockResolvedValue(taskMock);

        // 执行
        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'Size wrong' });

        // 断言
        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(true);

        expect(mockDbUpdate).toHaveBeenCalled();
        expect(mockDbUpdate().set).toHaveBeenCalledWith(expect.objectContaining({
            status: 'PENDING_VISIT', // 修正：代码中使用 PENDING_VISIT
            rejectCount: 1,
            rejectReason: 'Size wrong'
        }));
    });

    it('should fail if task does not exist or tenant mismatch', async () => {
        // Mock 返回 null（表示任务不存在或租户不匹配）
        mockDbQuery.measureTasks.findFirst.mockResolvedValue(null);

        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'reason' });

        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(false);
        expect(result.data?.error).toContain('任务不存在或无权访问');
    });

    it('should fail if task is CANCELLED', async () => {
        mockDbQuery.measureTasks.findFirst.mockResolvedValue({
            id: VALID_TASK_ID,
            tenantId: MOCK_TENANT_ID,
            status: 'CANCELLED',
            rejectCount: 0
        });

        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'reason' });

        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(false);
        expect(result.data?.error).toContain('无法驳回');
    });

    it('should trigger warning when reject count reaches threshold (3)', async () => {
        // Mock 店长列表（用于通知）
        mockDbQuery.users.findMany.mockResolvedValue([
            { id: 'manager-1', role: 'STORE_MANAGER' }
        ]);

        const taskMock = {
            id: VALID_TASK_ID,
            tenantId: MOCK_TENANT_ID,
            status: 'PENDING_CONFIRM',
            rejectCount: 2, // 2 + 1 = 3，触发预警
            measureNo: 'M-001'
        };
        mockDbQuery.measureTasks.findFirst.mockResolvedValue(taskMock);

        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'Bad quality' });

        expect(result.success).toBe(true);
        expect(result.data?.success).toBe(true);

        // 检查更新调用
        expect(mockDbUpdate).toHaveBeenCalled();

        const updateBuilder = mockDbUpdate.mock.results[0].value;
        const setSpy = updateBuilder.set;
        const setCall = setSpy.mock.calls[0][0];

        expect(setCall.rejectCount).toBe(3);

        // 验证返回的预警消息
        expect(result.data?.message).toContain('介入'); // "已通知店长介入"
    });

    it('should fail if user is not authorized', async () => {
        // Mock 未授权会话
        const { auth } = await import('@/shared/lib/auth');
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const result = await rejectMeasureTask({ taskId: VALID_TASK_ID, reason: 'reason' });

        // createSafeAction 内置 auth 校验，未授权时直接返回顶层错误
        expect(result.success).toBe(false);
        expect(result.error).toContain('未授权访问');
    });
});

