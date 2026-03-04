import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * 订单与客户 API 路由集成测试
 *
 * 覆盖：订单列表查询、订单创建、客户 CRUD、权限校验等高频场景
 */

// ========== Mock 矩阵 ==========
vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      orders: { findMany: vi.fn().mockResolvedValue([]) },
      quotes: { findFirst: vi.fn().mockResolvedValue(null) },
      customers: {
        findMany: vi.fn().mockResolvedValue([]),
        // 路由层用此方法反查 CUSTOMER 角色对应的 customerId
        findFirst: vi.fn().mockResolvedValue({ id: 'c-self', name: '测试客户' }),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'new-c1', name: '新客户' }]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    })),
    transaction: vi.fn(async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => {
      const tx = {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'o1', orderNo: 'ORD-001' }]),
          })),
        })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
      };
      return cb(tx);
    }),
  },
}));

vi.mock('@/shared/lib/generators', () => ({
  generateOrderNo: vi.fn().mockResolvedValue('ORD-GEN-001'),
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: { log: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/services/miniprogram/cache.service', () => ({
  CacheService: {
    getOrSet: vi.fn(async (_k: string, c: () => Promise<unknown>) => c()),
  },
}));

vi.mock('../auth-utils', async () => {
  const actual = await vi.importActual('../auth-utils');
  return {
    ...actual,
    getMiniprogramUser: vi.fn().mockResolvedValue({ id: 'u1', tenantId: 't1', role: 'sales' }),
    withMiniprogramAuth: vi.fn((handler) => async (req: NextRequest) => {
      const user = await authUtils.getMiniprogramUser(req);
      return handler(req, user);
    }),
  };
});

vi.mock('@/shared/services/miniprogram/security.service', () => ({
  RateLimiter: { allow: vi.fn().mockReturnValue(true), reset: vi.fn() },
  IdempotencyGuard: {
    check: vi.fn().mockReturnValue(null),
    start: vi.fn(),
    complete: vi.fn(),
    fail: vi.fn(),
  },
}));

vi.mock('@/shared/services/miniprogram/order.service', () => ({
  OrderService: {
    getOrders: vi
      .fn()
      .mockResolvedValue([
        { id: 'o1', orderNo: 'ORD001', status: 'PENDING_PO', customer: { name: '测试客户' } },
      ]),
    createOrderFromQuote: vi.fn().mockResolvedValue({ id: 'new-order-1', orderNo: 'ORD-NEW' }),
  },
  VALID_STATUSES: ['DRAFT', 'PENDING_PO', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'],
}));

vi.mock('@/shared/services/miniprogram/customer.service', () => ({
  CustomerService: {
    getCustomers: vi
      .fn()
      .mockResolvedValue({ data: [{ id: 'c1', name: '张三' }], total: 1, page: 1, limit: 50 }),
    createCustomer: vi
      .fn()
      .mockResolvedValue({ id: 'c-new', name: '新客户', phone: '13800001111' }),
  },
}));

import { GET as getOrdersHandler, POST as createOrderHandler } from '../orders/route';
import { GET as getCustomersHandler, POST as createCustomerHandler } from '../customers/route';
import * as authUtils from '../auth-utils';
import { OrderService } from '@/shared/services/miniprogram/order.service';
import { CustomerService } from '@/shared/services/miniprogram/customer.service';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const createReq = (url: string, method = 'GET', body: Record<string, unknown> | null = null) =>
  new NextRequest(url, { method, body: body ? JSON.stringify(body) : null });

// ===================== 订单 API =====================
describe('订单 API 路由测试', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /orders 应成功返回订单列表', async () => {
    const res = await getOrdersHandler(createReq('http://localhost/api/miniprogram/orders'));
    expect(res.status).toBe(200);
    expect(OrderService.getOrders).toHaveBeenCalled();
  });

  it('GET /orders?status=COMPLETED 带状态筛选应成功', async () => {
    const res = await getOrdersHandler(
      createReq('http://localhost/api/miniprogram/orders?status=COMPLETED')
    );
    expect(res.status).toBe(200);
  });

  it('GET /orders?page=2&limit=20 分页参数应传递', async () => {
    const res = await getOrdersHandler(
      createReq('http://localhost/api/miniprogram/orders?page=2&limit=20')
    );
    expect(res.status).toBe(200);
    expect(OrderService.getOrders).toHaveBeenCalled();
  });

  it('POST /orders 合法 quoteId 应成功创建订单', async () => {
    const res = await createOrderHandler(
      createReq('http://localhost/api/miniprogram/orders', 'POST', { quoteId: VALID_UUID })
    );
    expect(res.status).toBe(200);
  });

  it('POST /orders 非法 quoteId 应返回 400', async () => {
    const res = await createOrderHandler(
      createReq('http://localhost/api/miniprogram/orders', 'POST', { quoteId: 'invalid-uuid' })
    );
    expect(res.status).toBe(400);
  });

  it('POST /orders 缺少 quoteId 应返回 400', async () => {
    const res = await createOrderHandler(
      createReq('http://localhost/api/miniprogram/orders', 'POST', {})
    );
    expect(res.status).toBe(400);
  });

  it('未授权请求应返回 401', async () => {
    vi.mocked(authUtils.getMiniprogramUser).mockResolvedValueOnce(
      null as ReturnType<typeof authUtils.getMiniprogramUser> extends Promise<infer T> ? T : never
    );
    const res = await getOrdersHandler(createReq('http://localhost/api/miniprogram/orders'));
    expect(res.status).toBe(401);
  });

  // ============================================================
  // 安全测试：IDOR 数据隔离（RED 阶段 - 预期这两个测试初次运行会 FAIL）
  // ============================================================

  it('CUSTOMER 角色应只能查看自己绑定的订单（数据隔离）', async () => {
    // Arrange：模拟 CUSTOMER 角色用户
    vi.mocked(authUtils.getMiniprogramUser).mockResolvedValueOnce({
      id: 'u-customer-001',
      tenantId: 't1',
      role: 'customer',
    });

    // DB customers.findFirst 返回该用户绑定的 Customer 档案
    const { db } = await import('@/shared/api/db');
    vi.mocked(db.query.customers.findFirst).mockResolvedValueOnce({
      id: 'c-self-001',
      name: '客户张三',
    } as any);

    const res = await getOrdersHandler(createReq('http://localhost/api/miniprogram/orders'));
    expect(res.status).toBe(200);

    // 核心断言：OrderService.getOrders 必须携带 customerId 参数（隔离过滤）
    expect(OrderService.getOrders).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ customerId: 'c-self-001' })
    );
  });

  it('CUSTOMER 角色无 Customer 档案时应安全降级返回空列表', async () => {
    // Arrange：模拟 CUSTOMER 角色用户，但找不到对应档案
    vi.mocked(authUtils.getMiniprogramUser).mockResolvedValueOnce({
      id: 'u-customer-orphan',
      tenantId: 't1',
      role: 'customer',
    });

    const { db } = await import('@/shared/api/db');
    // 模拟 DB 查不到 Customer（孤儿用户场景）
    vi.mocked(db.query.customers.findFirst).mockResolvedValueOnce(undefined as any);

    const res = await getOrdersHandler(createReq('http://localhost/api/miniprogram/orders'));

    // 安全降级：返回 200 空列表，不能暴露其他客户数据，也不应报错
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);

    // 关键：不应调用 OrderService.getOrders（防止漏数据）
    expect(OrderService.getOrders).not.toHaveBeenCalled();
  });
});

// ===================== 客户 API =====================
describe('客户 API 路由测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      role: 'sales',
    });
  });

  it('GET /customers 应成功返回分页数据', async () => {
    const res = await getCustomersHandler(createReq('http://localhost/api/miniprogram/customers'));
    expect(res.status).toBe(200);
    expect(CustomerService.getCustomers).toHaveBeenCalled();
  });

  it('GET /customers?keyword=张 关键字搜索应成功', async () => {
    const res = await getCustomersHandler(
      createReq('http://localhost/api/miniprogram/customers?keyword=张')
    );
    expect(res.status).toBe(200);
  });

  it('GET /customers 分页参数应传递到服务层', async () => {
    const res = await getCustomersHandler(
      createReq('http://localhost/api/miniprogram/customers?page=3&limit=10')
    );
    expect(res.status).toBe(200);
    expect(CustomerService.getCustomers).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ page: 3, limit: 10 })
    );
  });

  it('POST /customers 合法数据应成功创建', async () => {
    const res = await createCustomerHandler(
      createReq('http://localhost/api/miniprogram/customers', 'POST', { name: '李四' })
    );
    expect(res.status).toBe(200);
  });

  it('POST /customers 缺少必填字段 name 应返回 400', async () => {
    const res = await createCustomerHandler(
      createReq('http://localhost/api/miniprogram/customers', 'POST', {})
    );
    expect(res.status).toBe(400);
  });

  it('POST /customers 未授权请求应返回 401', async () => {
    vi.mocked(authUtils.getMiniprogramUser).mockResolvedValueOnce(
      null as ReturnType<typeof authUtils.getMiniprogramUser> extends Promise<infer T> ? T : never
    );
    const res = await createCustomerHandler(
      createReq('http://localhost/api/miniprogram/customers', 'POST', { name: '测试' })
    );
    expect(res.status).toBe(401);
  });
});
