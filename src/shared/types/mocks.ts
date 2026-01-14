/**
 * 测试�?Mock 类型定义
 */

import { auth } from '@/shared/lib/auth';
import { leads } from '@/shared/api/schema';
import { InferSelectModel } from 'drizzle-orm';
import { vi } from 'vitest';

export type Lead = InferSelectModel<typeof leads>;

// Auth Mock 类型
export type MockAuth = typeof auth & {
  mockResolvedValue: typeof vi.fn;
  mockRejectedValue: typeof vi.fn;
};

// DB Query Mock 类型
export type MockDbQuery = {
  findMany: typeof vi.fn;
  findFirst: typeof vi.fn;
  findUnique: typeof vi.fn;
};

// DB Update Mock 类型
export type MockDbUpdate = {
  set: typeof vi.fn;
  where: typeof vi.fn;
};

// DB Insert Mock 类型
export type MockDbInsert = {
  values: typeof vi.fn;
  returning: typeof vi.fn;
};

// DB Transaction Mock 类型
export type MockDbTransaction = {
  update: (table: unknown) => MockDbUpdate;
  insert: (table: unknown) => MockDbInsert;
  delete: typeof vi.fn;
  query: {
    leads: MockDbQuery;
    orders: MockDbQuery;
    products: MockDbQuery;
    inventory: MockDbQuery;
    [key: string]: MockDbQuery;
  };
};

// DB Mock 类型
export type MockDb = {
  query: {
    leads: MockDbQuery;
    orders: MockDbQuery;
    products: MockDbQuery;
    inventory: MockDbQuery;
    [key: string]: MockDbQuery;
  };
  update: (table: unknown) => MockDbUpdate;
  insert: (table: unknown) => MockDbInsert;
  delete: typeof vi.fn;
  transaction: typeof vi.fn;
};

// Mock Lead 类型
export type MockLead = {
  id: string;
  tenantId: string;
  status: string;
  leadNo: string;
  customerName: string;
  [key: string]: unknown;
};

// Mock Order 类型
export type MockOrder = {
  id: string;
  tenantId: string;
  status: string;
  orderNo: string;
  [key: string]: unknown;
};

// Mock Product 类型
export type MockProduct = {
  id: string;
  tenantId: string;
  name: string;
  [key: string]: unknown;
};

// Mock Inventory 类型
export type MockInventory = {
  id: string;
  productId: string;
  quantity: number;
  [key: string]: unknown;
};
