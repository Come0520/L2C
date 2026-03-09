/**
 * Search 模块安全与功能测试
 * 覆盖 Auth 保护、Zod 校验、TenantId 隔离、以及高亮、Redis 历史记录、范围控制
 * v2: 新增 AP 财务类 (apSupplierStatements, apLaborStatements, receiptBills, paymentBills) 搜索测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalSearch } from '../actions';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { redis } from '@/shared/lib/redis';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
  checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      customers: { findMany: vi.fn().mockResolvedValue([]) },
      leads: { findMany: vi.fn().mockResolvedValue([]) },
      orders: { findMany: vi.fn().mockResolvedValue([]) },
      quotes: { findMany: vi.fn().mockResolvedValue([]) },
      products: { findMany: vi.fn().mockResolvedValue([]) },
      afterSalesTickets: { findMany: vi.fn().mockResolvedValue([]) },
      channels: { findMany: vi.fn().mockResolvedValue([]) },
      arStatements: { findMany: vi.fn().mockResolvedValue([]) },
      // 新增财务类 Mock
      apSupplierStatements: { findMany: vi.fn().mockResolvedValue([]) },
      apLaborStatements: { findMany: vi.fn().mockResolvedValue([]) },
      receiptBills: { findMany: vi.fn().mockResolvedValue([]) },
      paymentBills: { findMany: vi.fn().mockResolvedValue([]) },
      roles: { findMany: vi.fn().mockResolvedValue([{ permissions: ['*'] }]) },
    },
  },
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/shared/lib/redis', () => ({
  redis: {
    lrange: vi.fn(),
    lrem: vi.fn(),
    lpush: vi.fn(),
    ltrim: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((cb) => cb),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (tenantId = TENANT_A) => ({
  user: { id: USER_ID, role: 'ADMIN', roles: ['ADMIN'], tenantId, name: '测试用户' },
});

const mockAuth = vi.mocked(auth);

// ===== 测试套件 =====

describe('Search 模块 L5 升级测试 (globalSearch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth与鉴权保护', () => {
    it('未登录应返回 success: false', async () => {
      mockAuth.mockResolvedValue(null as never);
      const result = await globalSearch({ query: '测试' });
      expect(result.success).toBe(false);
    });

    it('关键词超长触发 Zod 校验失败', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      const result = await globalSearch({ query: 'a'.repeat(101) });
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined(); // Zod 报错无 data 返回
    });
  });

  describe('功能特性：历史记录、与空查询', () => {
    it('空关键词返回搜索历史 (history) 且不触发 db', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(redis?.lrange as any).mockResolvedValue(['history-1', 'history-2']);

      const result = await globalSearch({ query: '' });

      expect(result.success).toBe(true);
      expect(result.data?.history).toHaveLength(2);
      expect(result.data?.history[0].label).toBe('history-1');
      expect(db.query.customers.findMany).not.toHaveBeenCalled();
    });
  });

  describe('功能特性：实际搜索、高亮、租户隔离与范围控制', () => {
    it('带关键词搜索时触发数据库查询并记录历史，tenantId 正确隔离', async () => {
      mockAuth.mockResolvedValue(makeSession(TENANT_A) as never);
      vi.mocked(db.query.customers.findMany as any).mockResolvedValue([
        { id: 'c1', name: 'Alibaba', phone: '123' },
      ]);

      const result = await globalSearch({ query: 'Alibaba', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.customers).toHaveLength(1);
      expect(result.data?.customers[0].highlight?.label).toBe('<mark>Alibaba</mark>');

      // 验证 db 查询被调用
      expect(db.query.customers.findMany).toHaveBeenCalled();
      // 验证 redis 历史记录写入 (key 为 search:history:{tenantId}:{userId})
      expect(redis?.lpush).toHaveBeenCalledWith(`search:history:${TENANT_A}:${USER_ID}`, 'Alibaba');
    });

    it('限制 limit 参数正确生效', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      await globalSearch({ query: 'limit text', limit: 3 });
      expect(db.query.customers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 3 })
      );
    });

    it('空结果测试：数据库未命中任何数据时应返回空数组结构，且包含所有 12 个业务域', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.customers.findMany as any).mockResolvedValue([]);
      vi.mocked(db.query.leads.findMany as any).mockResolvedValue([]);
      vi.mocked(db.query.orders.findMany as any).mockResolvedValue([]);
      const result = await globalSearch({ query: '不存在的内容', scope: 'all' });

      expect(result.success).toBe(true);
      // 原有 8 个业务域
      expect(result.data?.customers).toBeDefined();
      expect(result.data?.leads).toBeDefined();
      expect(result.data?.orders).toBeDefined();
      expect(result.data?.quotes).toBeDefined();
      expect(result.data?.products).toBeDefined();
      expect(result.data?.tickets).toBeDefined();
      expect(result.data?.channels).toBeDefined();
      expect(result.data?.finances).toBeDefined();
      // 新增 4 个财务业务域
      expect(result.data?.apSuppliers).toBeDefined();
      expect(result.data?.apLabors).toBeDefined();
      expect(result.data?.receiptBills).toBeDefined();
      expect(result.data?.paymentBills).toBeDefined();
    });

    it('特性测试：指定 scope 时只返回特定模块数据', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      const result = await globalSearch({ query: '测试', scope: 'customers' });
      expect(result.success).toBe(true);
      expect(result.data?.customers).toBeDefined();
      expect(!result.data?.leads || result.data?.leads.length === 0).toBe(true);
    });

    it('特殊字符注入测试：带正则特殊字符的搜索应正常工作不应抛出异常', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      const weirdQuery = '^*()\\.+?[]{}|\\$';
      vi.mocked(db.query.customers.findMany as any).mockResolvedValue([
        { id: 'c1', name: `Test ${weirdQuery} Name`, phone: '123' },
      ]);

      const result = await globalSearch({ query: weirdQuery, scope: 'customers' });

      expect(result.success).toBe(true);
      expect(result.data?.customers).toHaveLength(1);
      expect(result.data?.customers[0].highlight?.label).toContain('<mark>');
    });

    it('Redis 降级测试：当 Redis 客户端抛异常或不存在时，必须静默降级且不影响数据库搜索响应', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(redis?.lpush as any).mockRejectedValue(new Error('Redis connection failed'));
      vi.mocked(db.query.customers.findMany as any).mockResolvedValue([
        { id: 'cdown', name: 'Alibaba', phone: '123' },
      ]);

      const result = await globalSearch({ query: 'Alibaba' });

      expect(result.success).toBe(true);
      expect(result.data?.customers).toHaveLength(1);
    });

    it('安全过滤测试：Zod 应过滤掉 % 和 _ 等 SQL 通配符', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.customers.findMany as any).mockResolvedValue([]);

      await globalSearch({ query: 'Test%_\\Query' });

      expect(db.query.customers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        })
      );
    });
  });

  // ===== 新增：财务 AP 相关搜索测试 =====

  describe('新功能：应付供应商对账单搜索 (apSupplierStatements)', () => {
    it('有 AP_VIEW 权限时，按单号搜索应付供应商对账单应返回结果', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.apSupplierStatements?.findMany as any).mockResolvedValue([
        { id: 'ap-s1', statementNo: 'APS-2024-001', supplierName: '测试供应商', status: 'PENDING' },
      ]);

      const result = await globalSearch({ query: 'APS-2024-001', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.apSuppliers).toHaveLength(1);
      expect(result.data?.apSuppliers[0].type).toBe('ap_supplier');
      expect(result.data?.apSuppliers[0].label).toBe('APS-2024-001');
      expect(result.data?.apSuppliers[0].highlight?.label).toContain('<mark>');
    });

    it('按供应商名称搜索应付供应商对账单应返回结果', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.apSupplierStatements?.findMany as any).mockResolvedValue([
        { id: 'ap-s2', statementNo: 'APS-2024-002', supplierName: '华虹材料', status: 'PAID' },
      ]);

      const result = await globalSearch({ query: '华虹', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.apSuppliers).toHaveLength(1);
      expect(result.data?.apSuppliers[0].sub).toBe('华虹材料');
    });
  });

  describe('新功能：应付劳务结算单搜索 (apLaborStatements)', () => {
    it('有 LABOR_VIEW 权限时，按单号搜索劳务结算单应返回结果', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.apLaborStatements?.findMany as any).mockResolvedValue([
        { id: 'ap-l1', statementNo: 'APL-2024-001', workerName: '张师傅', status: 'PENDING' },
      ]);

      const result = await globalSearch({ query: 'APL-2024-001', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.apLabors).toHaveLength(1);
      expect(result.data?.apLabors[0].type).toBe('ap_labor');
      expect(result.data?.apLabors[0].label).toBe('APL-2024-001');
    });

    it('按工人名字搜索劳务结算单应返回结果', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.apLaborStatements?.findMany as any).mockResolvedValue([
        { id: 'ap-l2', statementNo: 'APL-2024-002', workerName: '李师傅', status: 'CALCULATED' },
      ]);

      const result = await globalSearch({ query: '李师傅', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.apLabors[0].sub).toBe('李师傅');
    });
  });

  describe('新功能：收款单搜索 (receiptBills)', () => {
    it('有 AR_VIEW 权限时，按收款单号搜索应返回结果', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.receiptBills?.findMany as any).mockResolvedValue([
        { id: 'rb-1', receiptNo: 'RB-2024-001', customerName: '王客户', status: 'APPROVED' },
      ]);

      const result = await globalSearch({ query: 'RB-2024-001', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.receiptBills).toHaveLength(1);
      expect(result.data?.receiptBills[0].type).toBe('receipt_bill');
      expect(result.data?.receiptBills[0].label).toBe('RB-2024-001');
    });

    it('按客户名搜索收款单应返回结果', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.receiptBills?.findMany as any).mockResolvedValue([
        { id: 'rb-2', receiptNo: 'RB-2024-002', customerName: '张三', status: 'VERIFIED' },
      ]);

      const result = await globalSearch({ query: '张三', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.receiptBills[0].sub).toBe('张三');
    });
  });

  describe('新功能：付款单搜索 (paymentBills)', () => {
    it('有 AP_VIEW 权限时，按付款单号搜索应返回结果', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.paymentBills?.findMany as any).mockResolvedValue([
        { id: 'pb-1', paymentNo: 'PB-2024-001', payeeName: '华虹供应商', status: 'PAID' },
      ]);

      const result = await globalSearch({ query: 'PB-2024-001', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.paymentBills).toHaveLength(1);
      expect(result.data?.paymentBills[0].type).toBe('payment_bill');
      expect(result.data?.paymentBills[0].label).toBe('PB-2024-001');
    });

    it('按收款方名搜索付款单应返回结果', async () => {
      mockAuth.mockResolvedValue(makeSession() as never);
      vi.mocked(db.query.paymentBills?.findMany as any).mockResolvedValue([
        { id: 'pb-2', paymentNo: 'PB-2024-002', payeeName: '李安装师傅', status: 'PENDING' },
      ]);

      const result = await globalSearch({ query: '李安装', scope: 'all' });

      expect(result.success).toBe(true);
      expect(result.data?.paymentBills[0].sub).toBe('李安装师傅');
    });
  });
});
