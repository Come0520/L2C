import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { vi } from 'vitest';

import { useAuth } from '@/contexts/auth-context';

import LoginPage from '../(auth)/login/page';

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

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    login: vi.fn().mockResolvedValue(undefined),
    loginWithSms: vi.fn().mockResolvedValue(undefined),
    sendVerificationCode: vi.fn().mockResolvedValue(undefined),
    loginWithThirdParty: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login page correctly', () => {
    render(<LoginPage />);
    
    // Check page structure
    expect(screen.getByText('L2C')).toBeInTheDocument();
    expect(screen.getByText('企业级销售管理系统')).toBeInTheDocument();
    expect(screen.getByText('欢迎回来')).toBeInTheDocument();
    expect(screen.getByText('请登录您的账户')).toBeInTheDocument();
    
    // Check form elements
    expect(screen.getByLabelText(/手机号 \/ 邮箱/i)).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('should call login function with valid credentials', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      loginWithSms: vi.fn(),
      sendVerificationCode: vi.fn(),
      loginWithThirdParty: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginPage />);
    
    // Enter valid credentials
    fireEvent.change(screen.getByLabelText(/手机号 \/ 邮箱/i), { target: { value: '13800138000' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('13800138000', 'password123');
    });
  });

  it('should show error message when login fails', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      loginWithSms: vi.fn(),
      sendVerificationCode: vi.fn(),
      loginWithThirdParty: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/手机号 \/ 邮箱/i), { target: { value: '13800138000' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should handle third party login', () => {
    render(<LoginPage />);
    expect(screen.getByText('飞书登录')).toBeInTheDocument();
  });
});
