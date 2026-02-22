import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';

// 模拟认证会话
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: {
            id: 'test-user-id',
            tenantId: 'test-tenant-id'
        }
    })
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: vi.fn(),
        recordFromSession: vi.fn(),
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn()
}));

// 模拟数据库操作
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            installTasks: {
                findFirst: vi.fn()
            }
        },
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([])
            })
        })
    }
}));

vi.mock('drizzle-orm', async () => {
    const actual = await vi.importActual('drizzle-orm');
    return {
        ...actual,
        eq: vi.fn(),
        and: vi.fn()
    };
});

// 导入需要测试的 actions
import { updateInstallChecklistAction, checkOutInstallTaskAction } from '../../actions';

describe('安装清单验证测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updateInstallChecklistAction', () => {
        it('应该成功保存部分完成的清单', async () => {
            const mockData = {
                taskId: 'task-123',
                items: [
                    { id: 'track_smooth', label: '轨道顺滑', isChecked: true, required: true },
                    { id: 'steam_ironing', label: '蒸汽熨烫', isChecked: false, required: true },
                ]
            };

            const result = await updateInstallChecklistAction(mockData);

            expect(result.data?.success).toBe(true);
            expect(result.data?.message).toBe('清单状态已更新');
        });

        it('应该正确计算 allCompleted 状态 - 未完成', async () => {
            const mockData = {
                taskId: 'task-123',
                items: [
                    { id: 'track_smooth', label: '轨道顺滑', isChecked: true, required: true },
                    { id: 'steam_ironing', label: '蒸汽熨烫', isChecked: false, required: true },
                ]
            };

            await updateInstallChecklistAction(mockData);

            const updateCall = (db.update as any).mock.results[0].value.set.mock.calls[0][0];
            expect(updateCall.checklistStatus.allCompleted).toBe(false);
        });

        it('应该正确计算 allCompleted 状态 - 已完成', async () => {
            const mockData = {
                taskId: 'task-123',
                items: [
                    { id: 'track_smooth', label: '轨道顺滑', isChecked: true, required: true },
                    { id: 'steam_ironing', label: '蒸汽熨烫', isChecked: true, required: true },
                    { id: 'clean_up', label: '清理垃圾', isChecked: true, required: true },
                ]
            };

            await updateInstallChecklistAction(mockData);

            const updateCall = (db.update as any).mock.results[0].value.set.mock.calls[0][0];
            expect(updateCall.checklistStatus.allCompleted).toBe(true);
        });
    });

    describe('checkOutInstallTaskAction - Checklist 验证', () => {
        it('应该阻止签退 - 当清单未完成时', async () => {
            // 模拟任务有未完成的清单
            (db.query.installTasks.findFirst as any).mockResolvedValue({
                id: 'task-123',
                checklistStatus: {
                    items: [
                        { id: 'track_smooth', isChecked: true, required: true },
                        { id: 'steam_ironing', isChecked: false, required: true }
                    ],
                    allCompleted: false
                }
            });

            const result = await checkOutInstallTaskAction({
                id: 'task-123',
                location: { latitude: 39.9, longitude: 116.4 }
            });

            expect(result.data?.success).toBe(false);
            expect(result.data?.error).toBe('请先完成所有标准化作业检查项');
        });

        it('应该允许签退 - 当清单已完成时', async () => {
            // 模拟任务有已完成的清单
            (db.query.installTasks.findFirst as any).mockResolvedValue({
                id: 'task-123',
                checklistStatus: {
                    items: [
                        { id: 'track_smooth', isChecked: true, required: true },
                        { id: 'steam_ironing', isChecked: true, required: true }
                    ],
                    allCompleted: true
                }
            });

            const result = await checkOutInstallTaskAction({
                id: 'task-123',
                location: { latitude: 39.9, longitude: 116.4 },
                customerSignatureUrl: 'data:image/png;base64,...'
            });

            expect(result.data?.success).toBe(true);
            expect(result.data?.message).toBe('已提交完工申请，待销售验收');
        });

        it('应该阻止签退 - 当清单不存在时', async () => {
            // 模拟任务没有清单
            (db.query.installTasks.findFirst as any).mockResolvedValue({
                id: 'task-123',
                checklistStatus: null
            });

            const result = await checkOutInstallTaskAction({
                id: 'task-123',
                location: { latitude: 39.9, longitude: 116.4 }
            });

            expect(result.data?.success).toBe(false);
            expect(result.data?.error).toBe('请先完成所有标准化作业检查项');
        });
    });
});
