import { vi, describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { createDamageReport } from '../actions/damage-report';

// Mocks
vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      afterSalesTickets: { findFirst: vi.fn() },
      afterSalesDamageReports: { findFirst: vi.fn() },
      liabilityNotices: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'mock-report-id', reportNo: 'DR20240001' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((data) => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'mock-id', ...data }])),
        })),
      })),
    })),
    transaction: vi.fn((cb) =>
      cb({
        query: {
          afterSalesTickets: { findFirst: vi.fn() },
          afterSalesDamageReports: {
            findFirst: vi.fn(() =>
              Promise.resolve({
                id: '550e8400-e29b-41d4-a716-446655440020',
                status: 'DISPUTED',
                totalDamageAmount: '500',
                afterSalesTicketId: 'ticket-1',
              })
            ),
          },
          liabilityNotices: {
            findFirst: vi.fn(() =>
              Promise.resolve({
                id: 'mock-notice-id',
                signatureStatus: 'PENDING',
                damageReportId: 'mock-report-id',
                afterSalesId: 'mock-ticket-id',
              })
            ),
            findMany: vi.fn(() =>
              Promise.resolve([
                {
                  id: '550e8400-e29b-41d4-a716-446655440021',
                  signatureStatus: 'REJECTED',
                  amount: '500',
                  afterSalesId: 'mock-ticket-id',
                },
              ])
            ),
          },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() =>
              Promise.resolve([{ id: 'mock-report-id', reportNo: 'DR20240001' }])
            ),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn((data) => ({
            where: vi.fn(() => ({
              returning: vi.fn(() => Promise.resolve([{ id: 'mock-id', ...data }])),
            })),
          })),
        })),
      })
    ),
  },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    recordFromSession: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../utils', () => ({
  generateNoticeNo: vi.fn().mockResolvedValue('DR20240001'),
}));

// Mock deduction safety check
vi.mock('../logic/deduction-safety', () => ({
  checkDeductionAllowed: vi.fn(),
  checkMultipleDeductionsAllowed: vi.fn().mockResolvedValue([{ allowed: true }]),
  recordDebtLedger: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { checkDeductionAllowed, checkMultipleDeductionsAllowed } from '../logic/deduction-safety';

describe('Damage Report & Liability Assignment', () => {
  const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';
  const VALID_TICKET_ID = '550e8400-e29b-41d4-a716-446655440002';
  const VALID_INSTALLER_ID = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID },
    });
  });

  describe('createDamageReport (The Multi-party Creation)', () => {
    it('TDD-RED-1: should fail if sum of liable amounts !== totalDamageAmount', async () => {
      const input = {
        afterSalesTicketId: VALID_TICKET_ID,
        totalDamageAmount: 1000,
        description: 'Broken during installation',
        liabilities: [
          {
            liablePartyType: 'INSTALLER' as const,
            liablePartyId: VALID_INSTALLER_ID,
            amount: 500, // Sum is 500, but total is 1000
            reason: 'Dropped the box',
          },
        ],
      };

      const result = await createDamageReport(input);
      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(false);
      expect(result.data?.message).toContain('责任划分总额(¥500)必须等于定损总金额(¥1000)');
    });

    it('TDD-RED-2: should block creation if deduction safety limit is exceeded', async () => {
      // Mock safety check to return BLOCKED
      (checkMultipleDeductionsAllowed as any).mockResolvedValue([{
        allowed: false,
        status: 'BLOCKED',
        message: '扣款金额 ¥8000 超过最大限额 ¥5000',
      }]);

      (db.query.afterSalesTickets.findFirst as any).mockResolvedValue({
        id: VALID_TICKET_ID,
        type: 'RETURN',
        status: 'PROCESSING',
      });

      const input = {
        afterSalesTicketId: VALID_TICKET_ID,
        totalDamageAmount: 8000,
        description: 'Huge disaster',
        liabilities: [
          {
            liablePartyType: 'INSTALLER' as const,
            liablePartyId: VALID_INSTALLER_ID,
            amount: 8000,
            reason: 'Severely damaged',
          },
        ],
      };

      const result = await createDamageReport(input);

      expect(checkMultipleDeductionsAllowed).toHaveBeenCalledWith([{
        partyType: 'INSTALLER',
        partyId: VALID_INSTALLER_ID,
        amount: '8000'
      }]);
      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(false);
      expect(result.data?.message).toContain('超过最大限额');
    });
  });

  describe('signLiabilityNotice (The Signature Phase)', () => {
    it('TDD-RED-3: should update status to SIGNED and eventually APPROVED if all sign', async () => {
      // we will need to import signLiabilityNotice from a new actions file
      const { signLiabilityNotice } = await import('../actions/damage-report-signatures');

      const input = {
        noticeId: '550e8400-e29b-41d4-a716-446655440005',
        signatureImage: 'https://cdn.example.com/sign.png',
      };

      const result = await signLiabilityNotice(input);
      expect(result.success).toBe(true);
      expect(result.data?.data?.signatureStatus).toBe('SIGNED');
    });

    it('TDD-RED-4: should change Damage Report status to DISPUTED if rejected', async () => {
      const { rejectLiabilityNotice } = await import('../actions/damage-report-signatures');

      const input = {
        noticeId: '550e8400-e29b-41d4-a716-446655440006',
        rejectReason: '不是我弄坏的，是客户自己摔的',
      };

      const result = await rejectLiabilityNotice(input);
      expect(result.success).toBe(true);
      expect(result.data?.data?.signatureStatus).toBe('REJECTED');
      expect(result.data?.data?.damageReportStatus).toBe('DISPUTED');
    });
  });

  describe('arbitrateDamageReport (The Final Dispute Resolution)', () => {
    it('TDD-RED-5: should allow admin to override amounts and force ARBITRATED status', async () => {
      const { arbitrateDamageReportAction } = await import('../actions/damage-report-arbitration');

      const input = {
        damageReportId: '550e8400-e29b-41d4-a716-446655440020',
        memo: '经过调查，安装工只承担 50%，剩下公司承担',
        decisions: [
          {
            noticeId: '550e8400-e29b-41d4-a716-446655440021',
            finalAmount: 500,
          },
        ],
      };

      const result = await arbitrateDamageReportAction(input);
      expect(result.success).toBe(true);
      expect(result.data?.data?.damageReportStatus).toBe('ARBITRATED');
      // Ensure ledger was recorded
      const { recordDebtLedger } = await import('../logic/deduction-safety');
      expect(recordDebtLedger).toHaveBeenCalled();
    });
  });
});
