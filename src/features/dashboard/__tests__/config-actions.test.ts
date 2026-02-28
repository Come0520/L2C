import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardConfigAction, saveDashboardConfigAction, resetDashboardConfigAction } from '../actions/config';
import { WorkbenchService } from '@/services/workbench.service';
import { auth } from '@/shared/lib/auth';
import { revalidateTag } from 'next/cache';

// Mock auth
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

// Mock WorkbenchService
vi.mock('@/services/workbench.service', () => ({
    WorkbenchService: {
        getDashboardConfig: vi.fn(),
        updateDashboardConfig: vi.fn(),
    },
}));

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidateTag: vi.fn(),
}));

// Mock AuditService
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(true),
    },
}));

// Mock db
vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn((cb) => cb({
            query: {
                users: {
                    findFirst: vi.fn().mockResolvedValue({ id: 'u1' })
                }
            }
        })),
    },
}));

const mockSession = {
    user: {
        id: 'u1',
        tenantId: 't1',
        role: 'ADMIN'
    }
};

const validConfig = {
    version: 1,
    columns: 12,
    widgets: [{ id: 'w1', type: 'sales-leads', title: 'Test', x: 0, y: 0, w: 2, h: 2, visible: true }]
};

describe('Dashboard Config Actions 集成测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as never);
    });

    describe('getDashboardConfigAction', () => {
        it('应该调用 WorkbenchService 获取配置', async () => {
            const mockConfig = { ...validConfig };
            vi.mocked(WorkbenchService.getDashboardConfig).mockResolvedValue(mockConfig as never);

            const result = await getDashboardConfigAction();

            expect(result).toEqual(mockConfig);
            expect(WorkbenchService.getDashboardConfig).toHaveBeenCalledWith('u1', 'ADMIN');
        });
    });

    describe('saveDashboardConfigAction', () => {
        it('应该保存配置并清除缓存', async () => {
            vi.mocked(WorkbenchService.updateDashboardConfig).mockResolvedValue(undefined);

            const result = await saveDashboardConfigAction(validConfig);

            expect(result.success).toBe(true);
            expect(WorkbenchService.updateDashboardConfig).toHaveBeenCalledWith('u1', expect.anything());
            expect(revalidateTag).toHaveBeenCalledWith('dashboard-config:u1', {});
        });

        it('保存失败时应返回错误响应', async () => {
            vi.mocked(WorkbenchService.updateDashboardConfig).mockRejectedValue(new Error('SAVE_FAILED'));

            const result = await saveDashboardConfigAction(validConfig);
            expect(result.success).toBe(false);
            expect(result.error).toBe('保存失败');
        });
    });

    describe('resetDashboardConfigAction', () => {
        it('应该重置配置并清除缓存', async () => {
            vi.mocked(WorkbenchService.updateDashboardConfig).mockResolvedValue(undefined);

            const result = await resetDashboardConfigAction({});

            expect(result.success).toBe(true);
            expect(revalidateTag).toHaveBeenCalledWith('dashboard-config:u1', {});
        });

        it('重置失败时应返回错误响应', async () => {
            vi.mocked(WorkbenchService.updateDashboardConfig).mockRejectedValue(new Error('RESET_FAILED'));

            const result = await resetDashboardConfigAction({});
            expect(result.success).toBe(false);
            expect(result.error).toBe('重置失败');
        });
    });
});
