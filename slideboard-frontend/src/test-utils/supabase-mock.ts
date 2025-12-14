import { vi } from 'vitest';

// 创建一个模拟的supabase实例，包含所有必要的方法
export const createMockSupabase = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
    catch: vi.fn().mockResolvedValue({ data: null, error: null }),
    in: vi.fn().mockReturnThis(),
  };

  const mockAuth = {
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn((_cb: any) => {
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),

    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  };

  const mockSupabase = {
    from: vi.fn().mockReturnValue(mockQuery),
    rpc: vi.fn().mockResolvedValue({}),
    auth: mockAuth,
  };

  return mockSupabase;
};

// 全局Supabase Mock配置
export const setupSupabaseMock = () => {
  const mockSupabase = createMockSupabase();

  vi.mock('@/lib/supabase/client', () => ({
    supabase: mockSupabase,
    createClient: vi.fn(() => mockSupabase),
  }));

  return mockSupabase;
};

// 设置window对象模拟
export const setupWindowMock = () => {
  vi.stubGlobal('window', {
    location: {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
    },
    navigator: {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    },
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    // 添加其他必要的window属性
  });
};

// 清理所有mock
export const cleanupMocks = () => {
  vi.clearAllMocks();
};
