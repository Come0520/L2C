import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestDelivery, updateLogistics } from '../logistics';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { LogisticsService } from '@/services/logistics.service';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: {
                findFirst: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([{ id: '11111111-1111-4111-8111-111111111111' }])),
                })),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: vi.fn(),
    },
}));

vi.mock('@/services/logistics.service', () => ({
    LogisticsService: {
        updateLogisticsInfo: vi.fn(),
    },
}));

describe('Logistics Actions', () => {
    const mockSession = {
        user: {
            id: 'u123',
            tenantId: 't123',
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (checkPermission as any).mockResolvedValue(undefined);
        // 预设 findFirst 返回带 version 的订单（requestDelivery 在更新前会先查询）
        (db.query.orders.findFirst as any).mockResolvedValue({
            id: '11111111-1111-4111-8111-111111111111',
            tenantId: 't123',
            status: 'IN_PRODUCTION',
            version: 1,
        });
    });

    describe('requestDelivery', () => {
        const input = {
            orderId: '11111111-1111-4111-8111-111111111111',
            company: 'shunfeng',
            trackingNo: 'SF123',
            remark: 'Test remark',
            version: 1,
        };

        it('应成功请求发货并记录审计日志', async () => {
            const result = await requestDelivery(input);

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({
                action: 'ORDER_DELIVERY_REQUESTED',
                recordId: input.orderId,
            }));
        });

        it('应拒绝未经授权的请求', async () => {
            (auth as any).mockResolvedValue(null);
            await expect(requestDelivery(input)).rejects.toThrow('Unauthorized');
        });

        it('应检查权限', async () => {
            (checkPermission as any).mockRejectedValue(new Error('Forbidden'));
            await expect(requestDelivery(input)).rejects.toThrow('Forbidden');
        });
    });

    describe('updateLogistics', () => {
        const input = {
            orderId: '11111111-1111-4111-8111-222222222222',
            company: 'yuantong',
            trackingNo: 'YT456',
            version: 1,
        };

        it('应成功更新物流信息并记录审计', async () => {
            const result = await updateLogistics(input);

            expect(result.success).toBe(true);
            expect(LogisticsService.updateLogisticsInfo).toHaveBeenCalledWith(
                input.orderId,
                input.company,
                input.trackingNo
            );
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({
                action: 'ORDER_LOGISTICS_UPDATED',
                recordId: input.orderId,
            }));
        });

        it('当 LogisticsService 失败时应返回错误', async () => {
            (LogisticsService.updateLogisticsInfo as any).mockRejectedValue(new Error('Service failed'));
            const result = await updateLogistics(input);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Service failed');
        });
    });
});
