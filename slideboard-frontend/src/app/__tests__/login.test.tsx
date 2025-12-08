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

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
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
    expect(screen.getByText('Slideboard')).toBeInTheDocument();
    expect(screen.getByText('现代化幻灯片展示平台')).toBeInTheDocument();
    expect(screen.getByText('欢迎回来')).toBeInTheDocument();
    expect(screen.getByText('请登录您的账户')).toBeInTheDocument();
    
    // Check form elements
    expect(screen.getByLabelText('手机号')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    
    // Check login method tabs
    expect(screen.getByText('密码登录')).toBeInTheDocument();
    expect(screen.getByText('验证码登录')).toBeInTheDocument();
  });

  it('should toggle between password and SMS login methods', () => {
    render(<LoginPage />);
    
    // Start with password login
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.queryByLabelText('验证码')).not.toBeInTheDocument();
    
    // Switch to SMS login
    fireEvent.click(screen.getByText('验证码登录'));
    expect(screen.getByLabelText('验证码')).toBeInTheDocument();
    expect(screen.queryByLabelText('密码')).not.toBeInTheDocument();
    
    // Switch back to password login
    fireEvent.click(screen.getByText('密码登录'));
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.queryByLabelText('验证码')).not.toBeInTheDocument();
  });

  it('should show error message for invalid phone format in password login', async () => {
    render(<LoginPage />);
    
    // Enter invalid phone number
    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: 'invalid-phone' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument();
    });
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
    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '13800138000' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    
    // Check if login function was called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('13800138000', 'password123');
    });
  });

  it('should show loading state when logging in', async () => {
    const mockLogin = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));
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
    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '13800138000' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    
    // Check loading state
    expect(screen.getByText('登录中...')).toBeInTheDocument();
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.queryByText('登录中...')).not.toBeInTheDocument();
    });
  });

  it('should handle SMS code sending', async () => {
    const mockSendCode = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      loginWithSms: vi.fn(),
      sendVerificationCode: mockSendCode,
      loginWithThirdParty: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    
    render(<LoginPage />);
    
    // Switch to SMS login
    fireEvent.click(screen.getByText('验证码登录'));
    
    // Enter valid phone number
    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '13800138000' } });
    
    // Click send code button
    fireEvent.click(screen.getByText('获取验证码'));
    
    // Check if sendCode function was called
    await waitFor(() => {
      expect(mockSendCode).toHaveBeenCalledWith('13800138000');
    });
    
    // Check countdown
    await waitFor(() => {
      expect(screen.getByText(/\d+s后重发/i)).toBeInTheDocument();
    });
  });

  it('should handle third party login', () => {
    const mockLoginWithThirdParty = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      loginWithSms: vi.fn(),
      sendVerificationCode: vi.fn(),
      loginWithThirdParty: mockLoginWithThirdParty,
      register: vi.fn(),
      logout: vi.fn(),
    });
    
    render(<LoginPage />);
    
    // Click WeChat login button
    fireEvent.click(screen.getByText('微信登录'));
    expect(mockLoginWithThirdParty).toHaveBeenCalledWith('wechat');
    
    // Click Feishu login button
    fireEvent.click(screen.getByText('飞书登录'));
    expect(mockLoginWithThirdParty).toHaveBeenCalledWith('feishu');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<LoginPage />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
