// @ts-ignore
import { toHaveNoViolations } from 'jest-axe';
import { vi, expect } from 'vitest';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Mock navigator with clipboard
Object.defineProperty(window.navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
  configurable: true
});

// 设置测试环境变量
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
(process.env as any).NODE_ENV = 'test';

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
  onAuthStateChange: vi.fn((_cb: any) => {
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
      getStatusMetadata: vi.fn((code) => {
        const definitions = [
          { code: 'draft', name: '草稿', color: 'gray', icon: 'file-text' },
          { code: 'pending', name: '待审核', color: 'blue', icon: 'clock' },
          { code: 'approved', name: '已审核', color: 'green', icon: 'check' },
          { code: 'rejected', name: '已拒绝', color: 'red', icon: 'x' },
          { code: 'online', name: '已发布', color: 'green', icon: 'globe' },
          { code: 'offline', name: '已下线', color: 'gray', icon: 'cloud-off' }
        ];
        return definitions.find(d => d.code === code);
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
