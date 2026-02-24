import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importLeads } from '../mutations';
import { LeadService } from '../../../../services/lead.service';
import { AuditService } from '../../../../shared/services/audit-service';
import { db } from '../../../../shared/api/db';
import { auth, checkPermission } from '../../../../shared/lib/auth';
import { logger } from '../../../../shared/lib/logger';

// Mock dependencies
vi.mock('../../../../services/lead.service');
vi.mock('../../../../shared/services/audit-service');
vi.mock('../../../../shared/api/db', () => ({
    db: {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue({}),
    },
}));
vi.mock('../../../../shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));
vi.mock('../../../../shared/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('importLeads', () => {
    const MOCK_TENANT_ID = 'tenant-1';
    const MOCK_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue({
            user: { id: MOCK_USER_ID, tenantId: MOCK_TENANT_ID },
        });
        (checkPermission as any).mockResolvedValue(true);
    });

    it('should successfully import valid leads with concurrency', async () => {
        const mockData = [
            { customerName: 'Test 1', customerPhone: '13800000001' },
            { customerName: 'Test 2', customerPhone: '13800000002' },
        ];

        (LeadService.createLead as any).mockResolvedValue({ isDuplicate: false });

        const result = await importLeads(mockData);

        expect(result.successCount).toBe(2);
        expect(result.errors).toHaveLength(0);
        expect(LeadService.createLead).toHaveBeenCalledTimes(2);
        expect(AuditService.log).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'CREATE',
            tableName: 'leads',
        }));
    });

    it('should handle duplicates correctly', async () => {
        const mockData = [
            { customerName: 'Duplicate', customerPhone: '13811111111' },
        ];

        (LeadService.createLead as any).mockResolvedValue({
            isDuplicate: true,
            duplicateReason: 'PHONE'
        });

        const result = await importLeads(mockData);

        expect(result.successCount).toBe(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].error).toContain('手机号重复');
    });

    it('should handle validation errors', async () => {
        const mockData = [
            { customerName: '', customerPhone: 'invalid' }, // Invalid data according to schema
        ];

        const result = await importLeads(mockData);

        expect(result.successCount).toBe(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].error).toBeTruthy();
    });

    it('should include batch traceability in createLead calls', async () => {
        const mockData = [
            { customerName: 'Trace Test', customerPhone: '13822222222' },
        ];
        (LeadService.createLead as any).mockResolvedValue({ isDuplicate: false });

        await importLeads(mockData);

        const lastCallArgs = (LeadService.createLead as any).mock.calls[0][0];
        expect(lastCallArgs.importBatchId).toMatch(/^import_/);
        expect(lastCallArgs.rawData).toEqual(mockData[0]);
    });
});
