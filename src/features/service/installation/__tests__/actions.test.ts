import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession } from '@/shared/tests/mock-factory';
import { dispatchInstallTaskAction } from '../actions';
import { db } from '@/shared/api/db';
import * as authLib from '@/shared/lib/auth';
import * as sysConfig from '@/shared/config/system';
import * as fileService from '@/shared/services/file.service';
import * as auditService from '@/shared/services/audit-service';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

const mockWhere = vi.fn().mockReturnThis();
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockReturnThis = vi.fn().mockReturnThis();

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            installTasks: {
                findFirst: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            }
        },
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: mockWhere })) })),
        transaction: vi.fn(async (cb) => cb({ update: mockUpdate })),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    unstable_cache: vi.fn((cb) => cb),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn(),
        log: vi.fn()
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

// Mock drizzle-orm to capture and assert SQL conditions
vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('drizzle-orm')>();
    return {
        ...actual,
        eq: vi.fn((col: any, val: any) => ({ type: 'eq', colName: col?.name || 'unknown', val })),
        and: vi.fn((...args: any[]) => ({ type: 'and', args })),
    };
});

// Mock logistics and conflict
vi.mock('../logic/conflict-detection', () => ({
    checkSchedulingConflict: vi.fn().mockResolvedValue({ hasConflict: false }),
}));
vi.mock('../logic/payment-check', () => ({
    checkPaymentBeforeInstall: vi.fn().mockResolvedValue({ passed: true }),
}));
vi.mock('../logic/logistics-check', () => ({
    checkLogisticsReady: vi.fn().mockResolvedValue({ ready: true }),
}));
vi.mock('../services/notification.service', () => ({
    notifyTaskAssigned: vi.fn().mockResolvedValue(true),
}));

describe('Installation Actions (Service) - D3-006 TOCTOU Fix', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(authLib.auth).mockResolvedValue(MOCK_SESSION);

        // Set up default db update mock
        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: mockWhere,
            }),
        } as any);
    });

    describe('dispatchInstallTask', () => {
        it('MUST include tenantId in the UPDATE installTasks WHERE clause for logisticsReadyStatus (D3-006 TOCTOU)', async () => {
            // Arrange
            // Simulate existing task for UPDATE (required to trigger logistics check)
            vi.mocked(db.query.installTasks.findFirst).mockResolvedValue({
                id: 'task-123',
                tenantId: MOCK_TENANT_ID,
                orderId: 'order-123',
            } as any);

            // Simulate installer
            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                id: 'installer-123',
                name: 'John Doe',
                tenantId: MOCK_TENANT_ID,
            } as any);

            const payload = {
                id: 'task-123',
                installerId: 'installer-123',
                scheduledDate: '2026-03-10',
                scheduledTimeSlot: 'MORNING',
                feeBreakdown: { baseFee: 0 }
            };

            const result = await dispatchInstallTaskAction(payload as any);
            console.log('RESULT WAS SUCCESSFUL?', result.success);
            console.log('RESULT CONTENT:', JSON.stringify(result));

            // Assert
            expect(result.success).toBe(true);

            // Update is called twice: once for logistics, once for the main task update
            // Check the first call (for logistics)
            expect(db.update).toHaveBeenCalled();

            const firstWhereArg = mockWhere.mock.calls[0][0];

            // Assert that we used 'and' with eq checks for both id and tenantId
            expect(firstWhereArg).toEqual({
                type: 'and',
                args: expect.arrayContaining([
                    { type: 'eq', colName: 'id', val: 'task-123' },
                    { type: 'eq', colName: 'tenant_id', val: MOCK_TENANT_ID }
                ])
            });
        });
    });
});
