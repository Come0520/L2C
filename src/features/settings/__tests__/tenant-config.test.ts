import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    revalidatePath: vi.fn(),
    logAudit: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath,
    revalidateTag: vi.fn(),
}));
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mocks.logAudit },
}));

vi.mock('@/shared/api/db', () => {
    const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockResolvedValue([{ settings: {} }]),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue({}),
            })),
        })),
    };
    return {
        db: {
            query: {
                tenants: { findFirst: vi.fn().mockResolvedValue({ settings: {} }) },
            },
            transaction: vi.fn(async (callback) => await callback(mockTx)),
        },
    };
});

import {
    getTenantBusinessConfig,
    updateARPaymentConfig,
    updateAPPaymentConfig,
    updateWorkflowModeConfig,
} from '../actions/tenant-config';

describe('TenantConfig Actions - Task 3: Zod 校验测试', () => {
    const mockSession = {
        user: { id: 'u1', tenantId: 't1', role: 'ADMIN' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.checkPermission.mockResolvedValue(undefined);
    });

    describe('getTenantBusinessConfig', () => {
        it('未授权时应返回默认配置', async () => {
            mocks.auth.mockResolvedValue(null);
            const config = await getTenantBusinessConfig();
            expect(config.arPayment.minDepositRatio).toBe(0.30);
            expect(config.apPayment.prepaidBonusType).toBe('BALANCE');
            expect(config.workflowMode.measureDispatchMode).toBe('DISPATCHER');
        });
    });

    describe('updateARPaymentConfig', () => {
        it('合法配置应更新成功', async () => {
            const result = await updateARPaymentConfig({
                enableInstallment: true,
                minDepositRatio: 0.30,
                minDepositAmount: 500,
                depositCalcRule: 'HIGHER',
                allowDebtInstallCash: false,
                requireDebtInstallApproval: true,
            });
            expect(result.success).toBe(true);
        });

        it('比例超出范围应校验失败', async () => {
            const result = await updateARPaymentConfig({
                enableInstallment: true,
                minDepositRatio: 1.5, // 超出 0-1 范围
                minDepositAmount: 500,
                depositCalcRule: 'HIGHER',
                allowDebtInstallCash: false,
                requireDebtInstallApproval: true,
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('比例不能大于 1');
        });

        it('未授权时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await updateARPaymentConfig({
                enableInstallment: true,
                minDepositRatio: 0.3,
                minDepositAmount: 500,
                depositCalcRule: 'HIGHER',
                allowDebtInstallCash: false,
                requireDebtInstallApproval: true,
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });

        it('无权限时应返回错误', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('无权限'));
            const result = await updateARPaymentConfig({
                enableInstallment: true,
                minDepositRatio: 0.3,
                minDepositAmount: 500,
                depositCalcRule: 'HIGHER',
                allowDebtInstallCash: false,
                requireDebtInstallApproval: true,
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('无权限执行此操作');
        });
    });

    describe('updateAPPaymentConfig', () => {
        it('合法 AP 配置应更新成功', async () => {
            const result = await updateAPPaymentConfig({
                prepaidBonusType: 'GOODS',
                prepaidBonusRatio: 0.15,
            });
            expect(result.success).toBe(true);
        });

        it('非法枚举值应校验失败', async () => {
            const result = await updateAPPaymentConfig({
                // @ts-expect-error 测试非法输入
                prepaidBonusType: 'INVALID',
                prepaidBonusRatio: 0.15,
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateWorkflowModeConfig', () => {
        it('合法工作流配置应更新成功', async () => {
            const result = await updateWorkflowModeConfig({
                enableLeadAssignment: true,
                measureDispatchMode: 'SELF',
                installDispatchMode: 'DISPATCHER',
                enableLaborFeeCalc: true,
                enableOutsourceProcessing: false,
                enablePurchaseApproval: true,
            });
            expect(result.success).toBe(true);
        });
    });
});
