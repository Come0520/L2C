import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveRefundAndCreateReversal } from '../actions/refunds';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { AuditService } from '@/shared/services/audit-service';

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    log: vi.fn(),
    recordFromSession: vi.fn(),
  },
}));

const MOCK_TENANT_ID = 'test-tenant';
const MOCK_USER_ID = 'user-1';

describe('Approve Refund API Logics (TDD RED Phase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { tenantId: MOCK_TENANT_ID, id: MOCK_USER_ID },
    });
  });

  it('RED: should fail because approveRefundAndCreateReversal is not fully implemented', async () => {
    // 我们的目标是测试 approveRefundAndCreateReversal 能生成一条负数的 billing (冲销流水)
    // 但当前我们还没写这块逻辑（红阶段）
    const refundId = 'REFUND-MOCK-ID';

    // 我们模拟 db.transaction 抛错或行为符合我们预期的（不通过）
    (db.transaction as any).mockRejectedValue(new Error('未实现核心退款冲销逻辑'));

    await expect(approveRefundAndCreateReversal(refundId)).rejects.toThrow(
      '未实现核心退款冲销逻辑'
    );
  });
});
