/**
 * 线索模块统一�?Mock 配置
 * 提供 Drizzle ORM 的完整链�?API 模拟
 */

import { vi } from 'vitest';

/**
 * 创建 Drizzle Query Mock
 * 模拟 db.query.table.findFirst/Many
 */
export function createMockQuery() {
  return {
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
  };
}

/**
 * 创建 Drizzle Insert Mock
 * 模拟 db.insert(table).values(...).returning(...)
 */
export function createMockInsert() {
  return vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
    }),
  });
}

/**
 * 创建 Drizzle Update Mock
 * 模拟 db.update(table).set(...).where(...)
 */
export function createMockUpdate() {
  return vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
}

/**
 * 创建 Drizzle Delete Mock
 * 模拟 db.delete(table).where(...)
 */
export function createMockDelete() {
  return vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  });
}

/**
 * 创建 Drizzle Select Mock
 * 模拟 db.select(...).from(...).where(...) 等链式调�? */
export function createMockSelect() {
  return vi.fn().mockImplementation(() => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      rightJoin: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      having: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([{ count: 0 }]),
      then: vi.fn().mockImplementation((onFulfilled) => {
        return Promise.resolve([]).then(onFulfilled);
      }),
    };
    return chain;
  });
}

/**
 * 创建完整�?Transaction Mock 对象
 * 模拟 db.transaction(async (tx) => { ... }) 内部可用�?tx 对象
 */
export function createMockTransaction() {
  return {
    query: {
      leads: createMockQuery(),
      users: createMockQuery(),
      customers: createMockQuery(),
      marketChannelCategories: createMockQuery(),
      marketChannels: createMockQuery(),
      systemLogs: createMockQuery(),
      leadFollowupLogs: createMockQuery(),
    },
    insert: createMockInsert(),
    update: createMockUpdate(),
    delete: createMockDelete(),
    select: createMockSelect(),
  };
}

/**
 * 创建完整�?DB Mock 对象
 * 模拟 db 对象的所有常用方�? */
export function createMockDb() {
  const mockTransaction = vi.fn().mockImplementation(async (callback) => {
    return callback(createMockTransaction());
  });

  return {
    query: {
      leads: createMockQuery(),
      users: createMockQuery(),
      customers: createMockQuery(),
      marketChannelCategories: createMockQuery(),
      marketChannels: createMockQuery(),
      systemLogs: createMockQuery(),
      leadFollowupLogs: createMockQuery(),
    },
    insert: createMockInsert(),
    update: createMockUpdate(),
    delete: createMockDelete(),
    select: createMockSelect(),
    transaction: mockTransaction,
  };
}

/**
 * 创建测试用的线索数据
 */
export function createMockLead(overrides = {}) {
  return {
    id: 'test-lead-id',
    tenantId: 'test-tenant-id',
    leadNo: 'LD20260110001',
    customerName: '测试客户',
    customerPhone: '13800138000',
    sourceCategoryId: 'test-category-id',
    sourceSubId: 'test-channel-id',
    sourceDetail: '测试来源',
    intentionLevel: 'MEDIUM',
    estimatedAmount: '10000',
    status: 'PENDING_DISPATCH',
    assignedSalesId: null,
    assignedAt: null,
    tags: [],
    remark: '测试备注',
    createdBy: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActivityAt: new Date(),
    ...overrides,
  };
}

/**
 * 创建测试用的用户数据
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    tenantId: 'test-tenant-id',
    name: '测试用户',
    phone: '13800138000',
    email: 'test@example.com',
    role: 'SALES',
    isActive: true,
    ...overrides,
  };
}

/**
 * 创建测试用的客户数据
 */
export function createMockCustomer(overrides = {}) {
  return {
    id: 'test-customer-id',
    tenantId: 'test-tenant-id',
    name: '测试客户',
    phone: '13800138000',
    level: 'C',
    address: '测试地址',
    ...overrides,
  };
}

/**
 * 创建测试用的渠道大类数据
 */
export function createMockChannelCategory(overrides = {}) {
  return {
    id: 'test-category-id',
    tenantId: 'test-tenant-id',
    name: '线上',
    code: 'ONLINE',
    isActive: true,
    ...overrides,
  };
}

/**
 * 创建测试用的渠道数据
 */
export function createMockChannel(overrides = {}) {
  return {
    id: 'test-channel-id',
    tenantId: 'test-tenant-id',
    categoryId: 'test-category-id',
    name: '微信',
    code: 'WECHAT',
    isActive: true,
    ...overrides,
  };
}

/**
 * 创建测试用的跟进记录数据
 */
export function createMockFollowupLog(overrides = {}) {
  return {
    id: 'test-followup-id',
    leadId: 'test-lead-id',
    type: 'CALL',
    content: '测试跟进内容',
    result: 'CONNECTED',
    nextFollowupAt: null,
    nextFollowupNote: null,
    createdBy: 'test-user-id',
    createdAt: new Date(),
    ...overrides,
  };
}
