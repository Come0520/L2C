import { render, screen, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import { vi } from 'vitest';

import { ThemeProvider } from '@/contexts/theme-context';

import DashboardPage from '../dashboard/page';
// 不使用真实 AuthProvider 以避免 Supabase 环境依赖
// 彻底隔离 Supabase 客户端以防止环境变量检查
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      getUser: vi.fn(),
      verifyOtp: vi.fn(),
    },
  })),
}));

// Mock dependencies
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      role: 'SALES_STORE',
      phone: '13800138000',
    },
    loading: false,
    login: vi.fn(),
    loginWithSms: vi.fn(),
    sendVerificationCode: vi.fn(),
    loginWithThirdParty: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock data fetching functions
vi.mock('@/features/dashboard/hooks/useDashboard', () => ({
  useDashboard: vi.fn(() => ({
    stats: [
      { label: '本月销售额', value: '¥100,000', change: '+12%', trend: 'up' },
      { label: '新增客户', value: '100', change: '+5%', trend: 'up' },
      { label: '订单数量', value: '30', change: '-2%', trend: 'down' },
      { label: '转化率', value: '25%', change: '+1%', trend: 'up' },
    ],
    recentActivities: [],
    pendingTasks: [],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: vi.fn(() => ({
    dashboardStats: {
      leads: 100,
      quotes: 50,
      orders: 30,
      revenue: 100000,
    },
    loading: false,
  })),
}));

vi.mock('@/hooks/useLeads', () => ({
  useLeads: vi.fn(() => ({
    leads: [],
    loading: false,
    error: null,
    refreshLeads: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSalesOrders', () => ({
  useSalesOrders: vi.fn(() => ({
    orders: [],
    loading: false,
    error: null,
    refreshOrders: vi.fn(),
  })),
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard page correctly', () => {
    render(
      <ThemeProvider>
        <DashboardPage />
      </ThemeProvider>
    );
    
    // 页面标题
    expect(screen.getByRole('heading', { name: '工作台' })).toBeInTheDocument();
    
    // 仪表盘统计卡片
    expect(screen.getByText('本月销售额')).toBeInTheDocument();
    expect(screen.getByText('新增客户')).toBeInTheDocument();
    expect(screen.getByText('订单数量')).toBeInTheDocument();
    expect(screen.getByText('转化率')).toBeInTheDocument();
    
    // 分区标题
    expect(screen.getByText('最近活动')).toBeInTheDocument();
    expect(screen.getByText('最近订单')).toBeInTheDocument();
  });

  // 仪表板为静态页面内容，此处不验证加载状态

  it('should have no accessibility violations', async () => {
    const { container } = await act(async () => render(
      <ThemeProvider>
        <DashboardPage />
      </ThemeProvider>
    ));
    
    const results = await axe(container, {
      rules: {
        'heading-order': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  }, 10000);
});
