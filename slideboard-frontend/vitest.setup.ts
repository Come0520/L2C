import { vi } from 'vitest';
import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom';

// 设置简化的JSDOM环境，仅包含必要的功能
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: false, // 禁用视觉模拟以提高性能
  resources: 'none', // 禁用资源加载
  runScripts: 'dangerously'
});

// 一次性设置全局window和document
global.window = {
  ...dom.window,
  location: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  localStorage: dom.window.localStorage,
  sessionStorage: dom.window.sessionStorage,
  navigator: {
    ...dom.window.navigator,
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  },
  DOMRect: dom.window.DOMRect,
  getComputedStyle: dom.window.getComputedStyle,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
} as any;

global.document = dom.window.document;

// 设置测试环境变量
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.NODE_ENV = 'test';

// 模拟fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
} as any);

// 简化的supabase mock，仅包含基本功能
const mockQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn().mockResolvedValue({ data: [], error: null }),
  or: vi.fn().mockReturnThis(),
};

const mockAuth = {
  signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn((cb: any) => {
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }),
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
};

vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnValue(mockQuery),
    rpc: vi.fn().mockResolvedValue({}),
    auth: mockAuth,
  };

  return {
    supabase: mockSupabase,
    createClient: vi.fn(() => mockSupabase),
  };
});

// 清理未使用的mocks以提高性能
vi.mock('@/hooks/useWorkflow', () => {
  return {
    useWorkflow: vi.fn().mockReturnValue({
      activeConfig: {
        definitions: [
          { code: 'draft', name: '草稿' },
          { code: 'pending', name: '待审核' },
          { code: 'approved', name: '已审核' },
          { code: 'rejected', name: '已拒绝' },
          { code: 'online', name: '已发布' },
          { code: 'offline', name: '已下线' }
        ]
      },
      getStatusMetadata: vi.fn().mockReturnValue({
        name: '草稿',
        color: 'gray',
        icon: 'file-text'
      })
    })
  };
});

// 简化useRouter mock
vi.mock('next/navigation', () => {
  return {
    useRouter: vi.fn().mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: vi.fn().mockReturnValue('/'),
    useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
  };
});
