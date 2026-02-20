import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { slaChecker } from '../sla-checker';
import { db } from '@/shared/api/db';
import { notificationService } from '../service';

// Mock Dependencies
const hoisted = vi.hoisted(() => ({
    processApproval: vi.fn(async () => {
        return { success: true };
    }),
}));

vi.mock('../../approval/actions/processing', () => ({
    processApproval: hoisted.processApproval,
}));

vi.mock('@/shared/api/db', () => {
    // 定义无返回值 mockChain 以避免 `this` 隐式 any
    const mockChain: Record<string, ReturnType<typeof vi.fn>> = {};
    mockChain['set'] = vi.fn(() => mockChain);
    mockChain['where'] = vi.fn(() => mockChain);
    mockChain['returning'] = vi.fn(() => mockChain);
    mockChain['then'] = vi.fn((resolve: (val: unknown[]) => void) => { resolve([{}]); return mockChain; });
    return {
        db: {
            query: {
                tenants: { findMany: vi.fn().mockResolvedValue([]) },
                leads: { findMany: vi.fn() },
                measureTasks: { findMany: vi.fn() },
                approvalTasks: {
                    findMany: vi.fn().mockResolvedValue([]),
                    findFirst: vi.fn().mockResolvedValue(null),
                },
                notifications: { findMany: vi.fn() },
                users: { findMany: vi.fn() },
            },
            update: vi.fn(() => mockChain),
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    execute: vi.fn().mockResolvedValue({}),
                })),
            })),
        },
    };
});

vi.mock('../service', () => ({
    notificationService: {
        send: vi.fn().mockResolvedValue(true),
    },
}));

import { logger } from '@/shared/lib/logger';
// spyOn will be set up in beforeEach


describe('SLAChecker', () => {
    const mockTenantId = 'tenant-1';
    const mockActiveTenants = [{ id: mockTenantId, name: 'Tenant 1', settings: {} }];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.spyOn(logger, 'info').mockImplementation(vi.fn());
        vi.spyOn(logger, 'warn').mockImplementation(vi.fn());
        vi.spyOn(logger, 'error').mockImplementation(vi.fn());
        vi.mocked(db.query.tenants.findMany).mockResolvedValue(mockActiveTenants as never);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('checkLeadFollowupSLA', () => {
        it('should send notification for overdue leads', async () => {
            const now = new Date('2024-01-02T10:00:00Z');
            vi.setSystemTime(now);
            const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const mockOverdueLead = {
                id: 'lead-1',
                leadNo: 'L001',
                customerName: 'Test Customer',
                assignedSalesId: 'sales-1',
                tenantId: mockTenantId,
                lastActivityAt: new Date(threshold.getTime() - 1000),
            };

            vi.mocked(db.query.leads.findMany).mockResolvedValue([mockOverdueLead] as never);
            vi.mocked(db.query.notifications.findMany).mockResolvedValue([]);

            await slaChecker.checkLeadFollowupSLA();

            expect(notificationService.send).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'sales-1',
                title: '线索跟进超时提醒',
                metadata: expect.objectContaining({ leadId: 'lead-1' }),
            }));
        });

        it('should not send duplicate notification within 24 hours', async () => {
            const now = new Date('2024-01-02T10:00:00Z');
            vi.setSystemTime(now);

            vi.mocked(db.query.leads.findMany).mockResolvedValue([{ id: 'lead-1', assignedSalesId: 's1', leadNo: 'L001' }] as never);
            vi.mocked(db.query.notifications.findMany).mockResolvedValue([{
                userId: 's1',
                title: '跟进超时',
                content: 'L001'
            }]);

            await slaChecker.checkLeadFollowupSLA();

            expect(notificationService.send).not.toHaveBeenCalled();
        });
    });

    describe('checkMeasureTaskDispatchSLA', () => {
        it('should notify for unaccepted measurement tasks after 24 hours', async () => {
            const now = new Date('2024-01-02T10:00:00Z');
            vi.setSystemTime(now);

            const mockTask = {
                id: 'task-1',
                measureNo: 'M001',
                tenantId: mockTenantId,
                createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
            };

            const mockManager = { id: 'mgr-1', tenantId: mockTenantId, role: 'MANAGER' };

            vi.mocked(db.query.measureTasks.findMany).mockResolvedValue([mockTask] as never);
            vi.mocked(db.query.users.findMany).mockResolvedValue([mockManager] as never);
            vi.mocked(db.query.notifications.findMany).mockResolvedValue([]);

            await slaChecker.checkMeasureTaskDispatchSLA();

            expect(notificationService.send).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'mgr-1',
                title: '测量待派单超时警告',
            }));
        });
    });

    describe('checkApprovalSLA', () => {
        it('should auto timeout paused tasks after 48h', async () => {
            const now = new Date('2024-01-03T10:00:00Z');
            vi.setSystemTime(now);

            const mockPausedTask = {
                id: 'task-p1',
                tenantId: mockTenantId,
                status: 'PAUSED',
                nodeName: 'Step 1',
                instanceId: 'inst-1',
                approverId: 'user-1',
            };

            vi.mocked(db.query.approvalTasks.findMany)
                .mockResolvedValueOnce([mockPausedTask] as never) // Rule A
                .mockResolvedValueOnce([]); // Rule B

            vi.mocked(db.query.approvalTasks.findFirst).mockResolvedValue({ status: 'PAUSED' } as never);

            await slaChecker.checkApprovalSLA();

            expect(db.update).toHaveBeenCalled();
            expect(notificationService.send).toHaveBeenCalledWith(expect.objectContaining({
                title: '审批暂停已超时',
            }));
        });

        it('should auto approve pending tasks after 7 days (Rule B)', async () => {
            // 保持 fake timers 状态（beforeEach 已设置），仅设置系统时间
            const now = new Date('2024-01-10T10:00:00Z');
            vi.setSystemTime(now);

            const mockPendingTask = {
                id: 'task-p2',
                tenantId: mockTenantId,
                status: 'PENDING',
                createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
            };

            // checkApprovalSLA 对每个租户调用 approvalTasks.findMany 两次：
            // 第 1 次 = Rule A（查 PAUSED），第 2 次 = Rule B（查 PENDING）
            // 用调用计数器精确控制每次返回值，避免 Once 队列的边界问题
            let findManyCallCount = 0;
            vi.mocked(db.query.approvalTasks.findMany).mockImplementation(() => {
                findManyCallCount++;
                // Rule A 调用返回空（无 PAUSED 任务），Rule B 调用返回我们的待审批任务
                const result = findManyCallCount === 1 ? [] : [mockPendingTask];
                return Promise.resolve(result) as never;
            });

            // findFirst 用于二次验证状态，确认任务仍为 PENDING 才触发自动审批
            vi.mocked(db.query.approvalTasks.findFirst).mockResolvedValue(mockPendingTask as never);

            await slaChecker.checkApprovalSLA();

            expect(hoisted.processApproval).toHaveBeenCalledWith(expect.objectContaining({
                taskId: 'task-p2',
                action: 'APPROVE'
            }));
        });


    });

    describe('checkMeasureTaskDispatchSLA deduplication', () => {
        it('should not notify if manager already notified for the same task', async () => {
            const now = new Date('2024-01-02T10:00:00Z');
            vi.setSystemTime(now);

            const mockTask = { id: 'task-1', measureNo: 'M001', tenantId: mockTenantId, createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) };
            const mockManager = { id: 'mgr-1', tenantId: mockTenantId, role: 'MANAGER' };

            vi.mocked(db.query.measureTasks.findMany).mockResolvedValue([mockTask] as never);
            vi.mocked(db.query.users.findMany).mockResolvedValue([mockManager] as never);
            vi.mocked(db.query.notifications.findMany).mockResolvedValue([{
                userId: 'mgr-1',
                title: '测量待派单超时警告',
                metadata: { taskId: 'task-1', type: 'sla_measure_dispatch' }
            }]);

            await slaChecker.checkMeasureTaskDispatchSLA();

            expect(notificationService.send).not.toHaveBeenCalled();
        });
    });
});
