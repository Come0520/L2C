'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, useEffect } from 'react';

import { env } from '@/config/env';
import { authService } from '@/services/auth.client';
import { User, UserRole } from '@/shared/types/auth';
import { IDENTIFY_USER, RESET_USER } from '@/utils/analytics';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithSms: (phone: string, verificationCode: string) => Promise<void>;
  sendVerificationCode: (phone: string) => Promise<void>;
  loginWithThirdParty: (provider: 'wechat' | 'feishu') => Promise<void>;
  register: (phone: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // E2E TEST MODE: Mock user session
    if (env.NEXT_PUBLIC_E2E_TEST === 'true') {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('e2e-test-user') : null;
      if (storedUser) {
        let role = 'admin';
        let name = 'E2E Test User';
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.role) role = parsed.role;
          if (parsed.name) name = parsed.name;
        } catch (e) {
          // fallback to default if simple string
        }

        const mockUser: User = {
          id: `e2e-test-user-${role}`,
          phone: '13800138000', // Dummy phone
          name: name,
          role: role as UserRole,
          avatarUrl: undefined,
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUser(mockUser);
        setLoading(false);
        return;
      }
    }

    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Identify user in analytics
          // IDENTIFY_USER(currentUser.id, {
          //   role: currentUser.role,
          //   phone: currentUser.phone || '',
          //   name: currentUser.name
          // });
        } else {
          setUser(null);
          RESET_USER();
        }
      } catch (_error) {
        setUser(null);
        RESET_USER();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 监听认证状态变化
    const { unsubscribe } = authService.onAuthStateChange((event, session, currentUser) => {
      // console.log('Auth State Change:', event, currentUser);
      if (currentUser) {
        setUser(currentUser);
        // Identify user in analytics
        // IDENTIFY_USER(currentUser.id, {
        //   role: currentUser.role,
        //   phone: currentUser.phone || '',
        //   name: currentUser.name
        // });

        // 当用户登录成功(SIGNED_IN事件)且不是E2E测试模式时，执行重定向
        if (event === 'SIGNED_IN' && env.NEXT_PUBLIC_E2E_TEST !== 'true') {
          // 确保只在客户端执行，因为window在服务器端不可用
          if (typeof window !== 'undefined') {
            // 尝试从URL中获取redirectTo参数，如果没有则默认跳转到首页
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirectTo') || '/';
            router.replace(redirectTo);
          } else {
            // 服务器端默认跳转到首页
            router.replace('/');
          }
        }
      } else {
        setUser(null);
        RESET_USER();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      // E2E TEST MOCK
      if (env.NEXT_PUBLIC_E2E_TEST === 'true') {
        const mockUsers: Record<string, Partial<User>> = {
          '13800138000': { role: 'admin', name: 'E2E Admin' },
          '13800138001': { role: 'SERVICE_INSTALL', name: 'E2E Installer' },
          '13800138002': { role: 'SERVICE_MEASURE', name: 'E2E Measurer' },
          '13800138003': { role: 'SALES_STORE', name: 'E2E Sales' },
        };

        const mockUserBase = mockUsers[identifier];

        if (mockUserBase && password === '123456') {
          localStorage.setItem('e2e-test-user', JSON.stringify(mockUserBase)); // 存储角色信息以便恢复
          const mockUser: User = {
            id: `e2e-test-${mockUserBase.role}`,
            phone: identifier,
            name: mockUserBase.name || 'Test User',
            role: mockUserBase.role as UserRole,
            avatarUrl: undefined,
            email: `${mockUserBase.role}@example.com`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setUser(mockUser);
          // router.push('/'); // Remove this push, let the onAuthStateChange simulation handle it or the component
          // Actually, since we are mocking, authService.onAuthStateChange won't trigger unless we mock it too.
          // But here login just sets user.
          // Let's just return to mimic success.
          return;
        }
      }

      await authService.loginWithPhone(identifier, password);

      // 不在这里直接跳转，让 onAuthStateChange 更新用户状态
    } catch (_error) {
      throw _error;
    }
  };

  // 发送验证码
  const sendVerificationCode = async (phone: string) => {
    try {
      await authService.sendVerificationCode(phone);
    } catch (_error) {
      throw _error;
    }
  };

  // 验证码登录
  const loginWithSms = async (phone: string, verificationCode: string) => {
    try {
      await authService.loginWithSms(phone, verificationCode);
    } catch (_error) {
      throw _error;
    }
  };

  // 第三方登录
  const loginWithThirdParty = async (provider: 'wechat' | 'feishu') => {
    try {
      await authService.loginWithThirdParty(provider);
      // 第三方登录会跳转到外部页面，所以这里不需要额外的状态更新
    } catch (_error) {
      throw _error;
    }
  };

  const register = async (phone: string, password: string, name: string) => {
    try {
      await authService.register(phone, password, name);
      router.push('/');
    } catch (_error) {
      throw _error;
    }
  };

  const logout = async () => {
    try {
      if (env.NEXT_PUBLIC_E2E_TEST === 'true') {
        localStorage.removeItem('e2e-test-user');
      }

      await authService.logout();

      setUser(null);
      RESET_USER();
      router.push('/login');
    } catch (_error) {
      throw _error;
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithSms,
    sendVerificationCode,
    loginWithThirdParty,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内使用');
  }
  return context;
}
