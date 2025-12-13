import { vi } from 'vitest';

// 创建一个可配置的 Supabase mock 客户端
export const createMockSupabaseClient = (options = {}) => {
  // 默认 mock 数据
  const defaultOptions = {
    user: { id: 'test-user-123', email: 'test@example.com' },
    data: null,
    error: null,
    ...options
  };

  // 创建 mock 查询对象
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: defaultOptions.data,
      error: defaultOptions.error
    }),
    // 添加 then 方法以支持 Promise 链式调用
    then: vi.fn().mockImplementation((resolve) => {
      resolve({ data: defaultOptions.data, error: defaultOptions.error });
      return Promise.resolve();
    })
  };

  // 创建 mock Supabase 客户端
  const mockClient = {
    from: vi.fn().mockReturnValue(mockQuery),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: defaultOptions.user },
        error: null
      })
    },
    rpc: vi.fn().mockResolvedValue({
      data: defaultOptions.data,
      error: defaultOptions.error
    })
  };

  // 返回 mock 客户端和查询对象，以便测试中可以进一步配置
  return { mockClient, mockQuery };
};

// 直接导出 mock supabase 实例，与实际模块结构匹配
export const supabase = createMockSupabaseClient().mockClient;

// 直接导出 createClient 函数，与实际模块结构匹配
export const createClient = vi.fn(() => {
  const { mockClient } = createMockSupabaseClient();
  return mockClient;
});

// 用于服务器的 Vitest mock 配置
export const mockSupabaseServer = {
  createClient: vi.fn().mockResolvedValue(createMockSupabaseClient().mockClient)
};

// 添加 window 对象的 mock
export const setupWindowMock = () => {
  vi.stubGlobal('window', {
    location: { origin: 'http://localhost:3000' },
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
  });
};
