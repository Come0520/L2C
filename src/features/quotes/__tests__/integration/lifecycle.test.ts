import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

// Mock DB - Hoisted automatically but good practice to allow it
vi.mock('@/shared/api/db', () => {
  const mockDb = {
    query: {
      quotes: { findFirst: vi.fn() },
      customers: { findFirst: vi.fn() },
      customerAddresses: { findFirst: vi.fn() },
      tenants: { findFirst: vi.fn() },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ id: 'mock-id' }])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'new-order-id' }])),
      })),
    })),
    transaction: vi.fn((cb) => cb(mockDb)),
  };
  return { db: mockDb };
});

// Mock Risk Service - 不要 Mock 整个模块，改为 Spy
// vi.mock('@/services/risk-control.service', ...);

// Mock Auth to avoid next-auth import issues
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
  checkPermission: vi.fn().mockResolvedValue(true),
}));

// Mock Approval Submission
vi.mock('@/features/approval/actions/submission', () => ({
  submitApproval: vi.fn().mockResolvedValue({ success: true, id: 'mock-approval-id' }),
}));

// Imports after mocks
import { QuoteLifecycleService } from '@/services/quote-lifecycle.service';
import { db } from '@/shared/api/db';
import { RiskControlService as RealRiskControlService } from '@/services/risk-control.service';

describe('Quote Lifecycle E2E Integration', () => {
  const mockQuoteId = 'quote-123';
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockCustomerId = 'cust-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore implementation? No, we will mock it per test or globally here.
  });

  describe('Scenario A: Standard Lifecycle (Happy Path)', () => {
    it('should successfully submit and convert a low-risk quote to an order', async () => {
      // STEP 1: Submit Quote
      // ... (db mock setup)
      (db.query.quotes.findFirst as Mock).mockResolvedValue({
        id: mockQuoteId,
        status: 'DRAFT',
        finalAmount: '1000', // Added
        totalAmount: '1000',
        customerId: mockCustomerId,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Curtain A',
            category: 'CURTAIN',
            quantity: 1,
            unitPrice: 1000,
            subtotal: 1000,
            attributes: { color: 'red' },
            calculationParams: { width: 100, height: 200 },
          },
        ],
      });

      // Mock Risk Check (Pass) using SpyOn
      const spyRisk = vi.spyOn(RealRiskControlService, 'checkQuoteRisk').mockResolvedValue({
        requiresApproval: false,
        blockSubmission: false,
        reasons: [],
      } as any);

      // Action: Submit
      const result = await QuoteLifecycleService.submit(mockQuoteId, mockTenantId, mockUserId);

      // Assert: Status updated to SUBMITTED
      expect(result.status).toBe('PENDING_CUSTOMER');
      expect(db.update).toHaveBeenCalled();
      expect(spyRisk).toHaveBeenCalledWith(mockQuoteId, mockTenantId);

      // STEP 2: Convert to Order
      // ... (rest of the test)
      (db.query.customers.findFirst as Mock).mockResolvedValue({
        id: mockCustomerId,
        name: 'John Doe',
        phone: '13800000000',
      });
      (db.query.customerAddresses.findFirst as Mock).mockResolvedValue({
        address: '123 Main St',
        isDefault: true,
      });

      // Simulate updated quote status in DB (PENDING_CUSTOMER)
      (db.query.quotes.findFirst as Mock).mockResolvedValue({
        id: mockQuoteId,
        rootQuoteId: mockQuoteId,
        status: 'PENDING_CUSTOMER',
        customerId: mockCustomerId,
        finalAmount: '1000',
        quoteNo: 'Q-001',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Curtain A',
            category: 'CURTAIN',
            quantity: 1,
            unitPrice: 1000,
            subtotal: 1000,
            width: 100,
            height: 200,
            attributes: { color: 'red' },
            calculationParams: { width: 100, height: 200 },
          },
        ],
      });

      // Action: Convert
      const order = await QuoteLifecycleService.convertToOrder(
        mockQuoteId,
        mockTenantId,
        mockUserId
      );

      // Assert: Order Created
      expect(order).toBeDefined();
      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('Scenario B: High Risk Workflow', () => {
    it('should block or require approval for high risk quotes', async () => {
      // STEP 1: Submit High Risk Quote
      (db.query.quotes.findFirst as Mock).mockResolvedValue({
        id: mockQuoteId,
        status: 'DRAFT',
        finalAmount: '1000',
        items: [{ id: 'item-1', quantity: 1, unitPrice: 1000, subtotal: 1000 }],
      });

      // Mock Risk Check (Fail - Approval Required) using SpyOn
      vi.spyOn(RealRiskControlService, 'checkQuoteRisk').mockResolvedValue({
        requiresApproval: true,
        blockSubmission: false,
        reasons: ['Gross profit too low'],
      } as any);

      // Action: Submit
      const result = await QuoteLifecycleService.submit(mockQuoteId, mockTenantId, mockUserId);

      // Assert: PENDING_APPROVAL
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(result.riskReasons).toContain('Gross profit too low');

      // STEP 2: Reject Quote
      await QuoteLifecycleService.reject(mockQuoteId, 'Price too low', mockTenantId);

      // Assert: We just expect it to run without throwing
      expect(db.update).toHaveBeenCalled();
    });
  });
});
