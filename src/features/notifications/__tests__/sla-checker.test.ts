import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { slaChecker } from '../sla-checker';
import { db } from '@/shared/api/db';
import { notificationService } from '../service';

// Mock Dependencies
vi.mock('@/shared/api/db', () => {
    const mockReturnSelf = vi.fn().mockReturnThis();
    return {
        db: {
            query: {
                tenants: { findMany: vi.fn() },
                leads: { findMany: vi.fn() },
                measureTasks: { findMany: vi.fn() },
                approvalTasks: { findMany: vi.fn(), findFirst: vi.fn() },
                notifications: { findMany: vi.fn() },
                users: { findMany: vi.fn() },
            },
            update: vi.fn(() => ({
                set: mockReturnSelf,
                where: mockReturnSelf,
                execute: vi.fn().mockResolvedValue({}),
            })),
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

vi.mock('../approval/actions/processing', () => ({
    processApproval: vi.fn().mockResolvedValue({ success: true }),
}));

describe('SLAChecker', () => {
    const mockTenantId = 'tenant-1';
    const mockActiveTenants = [{ id: mockTenantId, name: 'Tenant 1', settings: {} }];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        (db.query.tenants.findMany as any).mockResolvedValue(mockActiveTenants);
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

            (db.query.leads.findMany as any).mockResolvedValue([mockOverdueLead]);
            (db.query.notifications.findMany as any).mockResolvedValue([]);

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

            (db.query.leads.findMany as any).mockResolvedValue([{ id: 'lead-1', assignedSalesId: 's1', leadNo: 'L001' }]);
            (db.query.notifications.findMany as any).mockResolvedValue([{
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

            (db.query.measureTasks.findMany as any).mockResolvedValue([mockTask]);
            (db.query.users.findMany as any).mockResolvedValue([mockManager]);
            (db.query.notifications.findMany as any).mockResolvedValue([]);

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

            (db.query.approvalTasks.findMany as any)
                .mockResolvedValueOnce([mockPausedTask]) // Rule A
                .mockResolvedValueOnce([]); // Rule B

            (db.query.approvalTasks.findFirst as any).mockResolvedValue({ status: 'PAUSED' });

            await slaChecker.checkApprovalSLA();

            expect(db.update).toHaveBeenCalled();
            expect(notificationService.send).toHaveBeenCalledWith(expect.objectContaining({
                title: '审批暂停已超时',
            }));
        });
    });
});
