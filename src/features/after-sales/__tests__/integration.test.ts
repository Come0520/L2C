import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createAfterSalesTicket,
  updateTicketStatus,
  closeResolutionCostClosure,
} from '../actions/ticket';
import {
  createLiabilityNotice,
  submitLiabilityNotice,
  disputeLiabilityNotice,
  arbitrateLiabilityNotice,
  confirmLiabilityNotice,
} from '../actions/liability';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { revalidatePath, revalidateTag } from 'next/cache';

// Mock Modules
vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      afterSalesTickets: { findFirst: vi.fn(), findMany: vi.fn() },
      orders: { findFirst: vi.fn() },
      liabilityNotices: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() =>
          Promise.resolve([{ id: 'mock-id', ticketNo: 'AS123', noticeNo: 'LN123' }])
        ),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve({})),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ total: '100.00', count: 1 }])),
      })),
    })),
    transaction: vi.fn((cb) =>
      cb({
        query: {
          afterSalesTickets: { findFirst: vi.fn() },
          orders: { findFirst: vi.fn() },
          liabilityNotices: { findFirst: vi.fn() },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() =>
              Promise.resolve([{ id: 'mock-id', ticketNo: 'AS123', noticeNo: 'LN123' }])
            ),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve({})),
          })),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{ total: '100.00' }])),
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cache: vi.fn((fn) => fn),
}));

vi.mock('../utils', () => ({
  generateTicketNo: vi.fn().mockResolvedValue('AS12345'),
  generateNoticeNo: vi.fn().mockResolvedValue('LN20240001'),
  escapeLikePattern: vi.fn((s) => s),
  maskPhoneNumber: vi.fn((s) => s),
}));

// Mock Finance Action
const mockCreateSupplierLiabilityStatement = vi.fn();
vi.mock('@/features/finance/actions/ap', () => ({
  createSupplierLiabilityStatement: (...args: any[]) =>
    mockCreateSupplierLiabilityStatement(...args),
}));

describe('After-Sales Integration Tests', () => {
  const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';
  const VALID_TICKET_ID = '550e8400-e29b-41d4-a716-446655440002';
  const VALID_ORDER_ID = '550e8400-e29b-41d4-a716-446655440003';
  const VALID_NOTICE_ID = '550e8400-e29b-41d4-a716-446655440004';
  const VALID_PARTY_ID = '550e8400-e29b-41d4-a716-446655440005';

  const mockSession = {
    user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSession);
    mockCreateSupplierLiabilityStatement.mockResolvedValue({ success: true });
  });

  it('should complete full ticket lifecycle: create -> investigate -> close with audit', async () => {
    // 1. Create Ticket
    (db.transaction as any).mockImplementationOnce(async (cb: any) => {
      const tx = {
        query: {
          orders: {
            findFirst: vi
              .fn()
              .mockResolvedValue({
                id: VALID_ORDER_ID,
                tenantId: VALID_TENANT_ID,
                customerId: 'c1',
                version: 1,
                updatedAt: new Date(),
              }),
          },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{ id: VALID_TICKET_ID, ticketNo: 'AS123' }])),
          })),
        })),
      };
      return cb(tx);
    });

    const createRes = await createAfterSalesTicket({
      orderId: VALID_ORDER_ID,
      type: 'REPAIR',
      description: 'Test',
      priority: 'MEDIUM',
    });
    expect(createRes.success).toBe(true);
    expect(AuditService.recordFromSession).toHaveBeenCalledWith(
      expect.anything(),
      'after_sales_tickets',
      VALID_TICKET_ID,
      'CREATE',
      expect.anything()
    );

    // 2. Update to INVESTIGATING
    (db.query.afterSalesTickets.findFirst as any).mockResolvedValue({
      id: VALID_TICKET_ID,
      status: 'PENDING',
      tenantId: VALID_TENANT_ID,
    });
    const updateRes = await updateTicketStatus({
      ticketId: VALID_TICKET_ID,
      status: 'INVESTIGATING',
    });
    expect(updateRes.success).toBe(true);
    expect(AuditService.recordFromSession).toHaveBeenCalledWith(
      expect.anything(),
      'after_sales_tickets',
      VALID_TICKET_ID,
      'UPDATE',
      expect.objectContaining({
        changed: { status: 'INVESTIGATING' },
      })
    );

    // 3. Final Closure
    (db.query.afterSalesTickets.findFirst as any).mockResolvedValue({
      id: VALID_TICKET_ID,
      tenantId: VALID_TENANT_ID,
      totalActualCost: '200',
      actualDeduction: '150',
      version: 1,
      updatedAt: new Date(),
    });
    const closeRes = await closeResolutionCostClosure(VALID_TICKET_ID);
    expect(closeRes.success).toBe(true);
    expect(AuditService.recordFromSession).toHaveBeenCalledWith(
      expect.anything(),
      'after_sales_tickets',
      VALID_TICKET_ID,
      'UPDATE',
      expect.objectContaining({
        changed: { internalLoss: '50', status: 'CLOSED' },
      })
    );
  });

  it('should process liability notice workflow with dispute and arbitration', async () => {
    // 1. Create Liability Notice
    (db.transaction as any).mockImplementationOnce(async (cb: any) => {
      const tx = {
        query: {
          afterSalesTickets: {
            findFirst: vi
              .fn()
              .mockResolvedValue({
                id: VALID_TICKET_ID,
                tenantId: VALID_TENANT_ID,
                status: 'PROCESSING',
              }),
          },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{ id: VALID_NOTICE_ID, noticeNo: 'LN001' }])),
          })),
        })),
      };
      return cb(tx);
    });

    const createRes = await createLiabilityNotice({
      afterSalesId: VALID_TICKET_ID,
      liablePartyType: 'FACTORY',
      liablePartyId: VALID_PARTY_ID,
      reason: 'Bad poly',
      liabilityReasonCategory: 'PRODUCTION_QUALITY',
      amount: 100,
    });
    expect(createRes.success).toBe(true);
    // 2. Submit for confirmation
    (db.query.liabilityNotices.findFirst as any).mockResolvedValue({
      id: VALID_NOTICE_ID,
      status: 'DRAFT',
      tenantId: VALID_TENANT_ID,
      version: 1,
      updatedAt: new Date(),
    });
    await submitLiabilityNotice({ noticeId: VALID_NOTICE_ID });
    expect(AuditService.recordFromSession).toHaveBeenCalledWith(
      expect.anything(),
      'liability_notices',
      VALID_NOTICE_ID,
      'UPDATE',
      expect.objectContaining({
        new: expect.objectContaining({ status: 'PENDING_CONFIRM' }),
      })
    );

    // 3. Dispute
    (db.query.liabilityNotices.findFirst as any).mockResolvedValue({
      id: VALID_NOTICE_ID,
      status: 'PENDING_CONFIRM',
      tenantId: VALID_TENANT_ID,
      version: 1,
      updatedAt: new Date(),
    });
    await disputeLiabilityNotice({ noticeId: VALID_NOTICE_ID, disputeReason: 'Not us' });
    expect(AuditService.recordFromSession).toHaveBeenCalledWith(
      expect.anything(),
      'liability_notices',
      VALID_NOTICE_ID,
      'UPDATE',
      expect.objectContaining({
        changed: { status: 'DISPUTED' },
      })
    );

    // 4. Arbitrate
    (db.query.liabilityNotices.findFirst as any).mockResolvedValue({
      id: VALID_NOTICE_ID,
      status: 'DISPUTED',
      tenantId: VALID_TENANT_ID,
      version: 1,
      updatedAt: new Date(),
    });
    await arbitrateLiabilityNotice({ noticeId: VALID_NOTICE_ID, arbitrationResult: 'Factory 50%' });
    expect(AuditService.recordFromSession).toHaveBeenCalledWith(
      expect.anything(),
      'liability_notices',
      VALID_NOTICE_ID,
      'UPDATE',
      expect.objectContaining({
        changed: { status: 'ARBITRATED' },
      })
    );

    // 5. Final Confirm (Back to DRAFT then CONFIRM for simplicity in test or mock logic)
    (db.transaction as any).mockImplementationOnce(async (cb: any) => {
      const tx = {
        query: {
          liabilityNotices: {
            findFirst: vi
              .fn()
              .mockResolvedValue({
                id: VALID_NOTICE_ID,
                status: 'DRAFT',
                tenantId: VALID_TENANT_ID,
                afterSalesId: VALID_TICKET_ID,
                amount: '100',
                liablePartyType: 'FACTORY',
                liablePartyId: VALID_PARTY_ID,
                version: 1,
                updatedAt: new Date(),
              }),
          },
        },
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ total: '100' }]) })),
        })),
      };
      return cb(tx);
    });
    const confirmRes = await confirmLiabilityNotice({ noticeId: VALID_NOTICE_ID });
    expect(confirmRes.success).toBe(true);
    expect(mockCreateSupplierLiabilityStatement).toHaveBeenCalledWith(VALID_NOTICE_ID);
  });
});
