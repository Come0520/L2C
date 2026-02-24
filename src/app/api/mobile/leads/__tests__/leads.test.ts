import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Mock 依赖
vi.mock('@/shared/middleware/api-timing', () => ({
    withTiming: (fn: any) => fn,
}));

vi.mock('@/shared/middleware/mobile-auth', () => ({
    authenticateMobile: vi.fn(),
    requireSales: vi.fn(),
}));

vi.mock('@/services/lead.service', () => ({
    LeadService: {
        getMobileLeads: vi.fn(),
        createLead: vi.fn(),
    }
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn() }
}));

// Mock db 防止间接 import 触发真实数据库初始化（DATABASE_URL not defined）
vi.mock('@/shared/api/db', () => ({
    db: {
        query: { leads: { findFirst: vi.fn(), findMany: vi.fn() } },
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => []) })) })) })),
    }
}));

// Mock z-schema
vi.mock('@/features/leads/schemas', () => ({
    createLeadSchema: { safeParse: vi.fn((data) => ({ success: true, data })) }
}));

// 2. 导入被测函数
import { GET, POST } from '../route';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';

describe('移动端线索 API (Leads API)', () => {
    const mockSession = { userId: 'u1', tenantId: 't1', role: 'SALES' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(authenticateMobile).mockResolvedValue({ success: true, session: mockSession } as any);
        vi.mocked(requireSales).mockReturnValue({ allowed: true } as any);
    });

    it('GET: 应正常返回分页线索', async () => {
        const req = new NextRequest('http://localhost/api/mobile/leads?type=mine&page=1');
        vi.mocked(LeadService.getMobileLeads).mockResolvedValue({
            items: [{ id: 'l1', leadNo: 'L001', customerName: '张三', customerPhone: '13800000000', status: 'NEW' }],
            total: 1
        } as any);

        const res = await GET(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.items).toHaveLength(1);
    });

    it('POST: 创建重复线索应返回 409', async () => {
        const req = new NextRequest('http://localhost/api/mobile/leads', {
            method: 'POST',
            body: JSON.stringify({ customerName: '张三', customerPhone: '13800000000', source: 'ADS' })
        });

        vi.mocked(LeadService.createLead).mockResolvedValue({
            isDuplicate: true,
            duplicateReason: 'PHONE',
            lead: { id: 'l1' }
        } as any);

        const res = await POST(req);
        expect(res.status).toBe(409);
    });
});
