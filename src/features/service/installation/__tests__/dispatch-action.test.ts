import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchInstallTaskAction } from '../actions';
import { checkPaymentBeforeInstall } from '../logic/payment-check';
import { checkSchedulingConflict } from '../logic/conflict-detection';
import { checkLogisticsReady } from '../logic/logistics-check';
import { AuditService } from '@/shared/services/audit-service';

// Mocks
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: 'user-1', tenantId: 'tenant-1', name: 'Tester' },
    }),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn((...args) => console.error('LOGGER ERROR:', ...args)),
        warn: vi.fn(),
        debug: vi.fn(),
    }
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn(),
    },
}));

vi.mock('../logic/payment-check', () => ({
    checkPaymentBeforeInstall: vi.fn(),
}));

vi.mock('../logic/conflict-detection', () => ({
    checkSchedulingConflict: vi.fn().mockResolvedValue({ hasConflict: false, conflictType: 'NONE' }),
}));

vi.mock('../logic/logistics-check', () => ({
    checkLogisticsReady: vi.fn().mockResolvedValue({ ready: true }),
}));

// P1 修复：由于 notifyTaskAssigned 返回 undefined 导致 actions 抛错，添加正确的 mock
vi.mock('@/shared/lib/wechat', () => ({
    notifyTaskAssigned: vi.fn().mockResolvedValue({ errcode: 0 }),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            installTasks: {
                findFirst: vi.fn().mockResolvedValue({
                    id: 'task-1',
                    status: 'PENDING_DISPATCH',
                    installerId: null,
                    tenantId: 'tenant-1',
                    orderId: 'order-1'
                }),
            },
            users: {
                findFirst: vi.fn().mockResolvedValue({
                    id: 'worker-1',
                    tenantId: 'tenant-1'
                })
            }
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(),
            })),
        })),
        transaction: vi.fn(async (cb) => {
            const dbMock = {
                query: {
                    installTasks: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: 'task-1',
                            status: 'PENDING_DISPATCH',
                            installerId: null,
                            tenantId: 'tenant-1'
                        }),
                    },
                    users: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: 'worker-1',
                            tenantId: 'tenant-1'
                        })
                    }
                },
                update: vi.fn(() => ({
                    set: vi.fn(() => ({
                        where: vi.fn(),
                        returning: vi.fn().mockResolvedValue([{ id: 'task-1' }])
                    })),
                })),
            };
            return cb(dbMock);
        }),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('TDD: Dispatch Action Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. 当付款检查失败且没有配置前置审批时，应该拦截派单', async () => {
        (checkPaymentBeforeInstall as any).mockResolvedValue({
            passed: false,
            reason: '未结清款项 ¥1000.00，现结客户需全款后安装',
            requiresApproval: false,
        });

        const result = await dispatchInstallTaskAction({
            id: 'task-1',
            installerId: 'worker-1',
            scheduledDate: '2026-03-08',
            scheduledTimeSlot: '上午',
            laborFee: 100,
        });

        expect(result.data?.success).toBe(false);
        expect(result.data?.error).toContain('未结清款项');
        expect(AuditService.recordFromSession).not.toHaveBeenCalled();
    });

    it('2. 当付款检查通过时，应该允许派单，并且不产生双重审计记录', async () => {
        (checkPaymentBeforeInstall as any).mockResolvedValue({
            passed: true,
        });

        const result = await dispatchInstallTaskAction({
            id: 'task-1',
            installerId: 'worker-1',
            scheduledDate: '2026-03-08' as any,
            scheduledTimeSlot: '上午',
            laborFee: 100,
        });
        if (!result.data?.success) {
            throw new Error('Action Failed: ' + result.data?.error);
        }

        expect(result.data?.success).toBe(true);
        // 断言审计记录最多只能调用一次 (防止双重调用错误)
        expect(AuditService.recordFromSession).toHaveBeenCalledTimes(1);
    });
});
