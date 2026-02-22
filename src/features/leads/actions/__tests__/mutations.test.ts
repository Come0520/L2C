/**
 * Leads 模块 Server Actions 集成测试 (Mutations)
 *
 * 覆盖范围：
 * - createLead / updateLead / assignLead / addFollowup
 * - voidLead / releaseToPool / claimFromPool
 * - convertLead / importLeads
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;
const MOCK_USER_ID = MOCK_SESSION.user.id;
const MOCK_LEAD_ID = '550e8400-e29b-41d4-a716-446655440000';

// ── Mock 配置 ──
const mockLeadService = {
    createLead: vi.fn(),
    updateLead: vi.fn(),
    assignLead: vi.fn(),
    addActivity: vi.fn(),
    voidLead: vi.fn(),
    releaseToPool: vi.fn(),
    claimFromPool: vi.fn(),
    convertLead: vi.fn(),
};

vi.mock('@/services/lead.service', () => ({
    LeadService: mockLeadService,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {}
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        LEAD: {
            CREATE: 'lead:create',
            EDIT: 'lead:edit',
            ASSIGN: 'lead:assign',
            DELETE: 'lead:delete',
            TRANSFER: 'lead:transfer',
            MANAGE: 'lead:manage',
            IMPORT: 'lead:import',
        }
    }
}));

// ── 测试套件 ──
describe('Lead Mutations (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
    });

    // ── createLead ──
    describe('createLead', () => {
        const validInput = {
            customerName: '张三',
            customerPhone: '13800138000',
        };

        it('应当成功创建线索并返回数据', async () => {
            mockLeadService.createLead.mockResolvedValue({
                isDuplicate: false,
                lead: { id: MOCK_LEAD_ID, customerName: '张三' }
            });
            const { createLead } = await import('../mutations');

            const result = await createLead(validInput);

            expect(result.success).toBe(true);
            expect(mockLeadService.createLead).toHaveBeenCalledWith(
                expect.objectContaining({ customerName: '张三' }),
                MOCK_TENANT_ID,
                MOCK_USER_ID
            );
        });

        it('检测到重复线索时应返回 DUPLICATE 状态', async () => {
            mockLeadService.createLead.mockResolvedValue({
                isDuplicate: true,
                duplicateReason: 'PHONE',
                lead: { id: 'existing-id', customerName: '张三', assignedSalesId: 'sales-1' }
            });
            const { createLead } = await import('../mutations');

            const result = await createLead(validInput);

            expect(result.success).toBe(false);
            expect(result.status).toBe('DUPLICATE');
        });

        it('未登录时应抛出 Unauthorized', async () => {
            const { auth } = await import('@/shared/lib/auth');
            vi.mocked(auth).mockResolvedValue(null);
            const { createLead } = await import('../mutations');

            await expect(createLead(validInput)).rejects.toThrow('Unauthorized');
        });
    });

    // ── updateLead ──
    describe('updateLead', () => {
        it('应当委托 LeadService.updateLead 并返回成功结果', async () => {
            mockLeadService.updateLead.mockResolvedValue({ id: MOCK_LEAD_ID });
            const { updateLead } = await import('../mutations');

            const result = await updateLead({ id: MOCK_LEAD_ID, customerName: '李四' });

            expect(result.success).toBe(true);
            expect(mockLeadService.updateLead).toHaveBeenCalledWith(
                MOCK_LEAD_ID,
                expect.objectContaining({ customerName: '李四' }),
                MOCK_TENANT_ID
            );
        });
    });

    // ── assignLead ──
    describe('assignLead', () => {
        it('应当调用 LeadService.assignLead 并传入正确参数', async () => {
            mockLeadService.assignLead.mockResolvedValue({ id: MOCK_LEAD_ID });
            const { assignLead } = await import('../mutations');

            const result = await assignLead({ id: MOCK_LEAD_ID, salesId: 'sales-001' });

            expect(result.success).toBe(true);
            expect(mockLeadService.assignLead).toHaveBeenCalledWith(
                MOCK_LEAD_ID, 'sales-001', MOCK_TENANT_ID, MOCK_USER_ID, undefined
            );
        });
    });

    // ── addFollowup ──
    describe('addFollowup', () => {
        it('应当调用 LeadService.addActivity', async () => {
            mockLeadService.addActivity.mockResolvedValue(undefined);
            const { addFollowup } = await import('../mutations');

            await addFollowup({
                leadId: MOCK_LEAD_ID,
                type: 'PHONE_CALL',
                content: '电话沟通设计需求',
            });

            expect(mockLeadService.addActivity).toHaveBeenCalledWith(
                MOCK_LEAD_ID,
                expect.objectContaining({ type: 'PHONE_CALL', content: '电话沟通设计需求' }),
                MOCK_TENANT_ID,
                MOCK_USER_ID,
                undefined
            );
        });
    });

    // ── voidLead ──
    describe('voidLead', () => {
        it('应当成功作废线索', async () => {
            mockLeadService.voidLead.mockResolvedValue(undefined);
            const { voidLead } = await import('../mutations');

            const result = await voidLead({ id: MOCK_LEAD_ID, reason: '客户不感兴趣' });

            expect(result.success).toBe(true);
            expect(mockLeadService.voidLead).toHaveBeenCalledWith(
                MOCK_LEAD_ID, '客户不感兴趣', MOCK_TENANT_ID, MOCK_USER_ID, undefined
            );
        });

        it('Service 抛出异常时应返回失败', async () => {
            mockLeadService.voidLead.mockRejectedValue(new Error('不可作废'));
            const { voidLead } = await import('../mutations');

            const result = await voidLead({ id: MOCK_LEAD_ID, reason: '原因' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('不可作废');
        });
    });

    // ── releaseToPool ──
    describe('releaseToPool', () => {
        it('应当释放线索到公海池', async () => {
            mockLeadService.releaseToPool.mockResolvedValue(undefined);
            const { releaseToPool } = await import('../mutations');

            const result = await releaseToPool(MOCK_LEAD_ID);

            expect(result.success).toBe(true);
            expect(mockLeadService.releaseToPool).toHaveBeenCalledWith(
                MOCK_LEAD_ID, MOCK_TENANT_ID, MOCK_USER_ID, false
            );
        });
    });

    // ── claimFromPool ──
    describe('claimFromPool', () => {
        it('应当从公海池认领线索', async () => {
            mockLeadService.claimFromPool.mockResolvedValue(undefined);
            const { claimFromPool } = await import('../mutations');

            const result = await claimFromPool(MOCK_LEAD_ID);

            expect(result.success).toBe(true);
            expect(mockLeadService.claimFromPool).toHaveBeenCalledWith(
                MOCK_LEAD_ID, MOCK_TENANT_ID, MOCK_USER_ID
            );
        });
    });

    // ── convertLead ──
    describe('convertLead', () => {
        it('应当转化线索为客户并返回新客户 ID', async () => {
            mockLeadService.convertLead.mockResolvedValue('new-customer-id');
            const { convertLead } = await import('../mutations');

            const result = await convertLead({ leadId: MOCK_LEAD_ID });

            expect(result).toBe('new-customer-id');
            expect(mockLeadService.convertLead).toHaveBeenCalledWith(
                MOCK_LEAD_ID, undefined, MOCK_TENANT_ID, MOCK_USER_ID, undefined
            );
        });
    });

    // ── importLeads ──
    describe('importLeads', () => {
        it('应当批量导入并统计成功/失败数', async () => {
            mockLeadService.createLead
                .mockResolvedValueOnce({ isDuplicate: false, lead: { id: '1' } })
                .mockResolvedValueOnce({ isDuplicate: true, duplicateReason: 'PHONE', lead: { id: '2' } });

            const { importLeads } = await import('../mutations');

            const result = await importLeads([
                { customerName: '甲', customerPhone: '13800138001' },
                { customerName: '乙', customerPhone: '13800138002' },
            ]);

            expect(result.successCount).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].error).toContain('重复线索');
        });

        it('格式不合法的行应记录错误而不中断', async () => {
            const { importLeads } = await import('../mutations');

            const result = await importLeads([
                { customerName: '', customerPhone: '123' }, // 无效数据
            ]);

            expect(result.successCount).toBe(0);
            expect(result.errors).toHaveLength(1);
        });
    });
});
