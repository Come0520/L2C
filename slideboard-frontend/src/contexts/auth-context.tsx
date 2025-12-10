'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, useEffect } from 'react';

import { env } from '@/config/env';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/shared/types/user'; // 从user.ts导入统一的UserRole类型
import { IDENTIFY_USER, RESET_USER } from '@/utils/analytics';

interface User {
  id: string;
  phone: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
}

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
  const supabase = createClient();

  useEffect(() => {
    // DEVELOPMENT ONLY: Mock user session for development
    // 已禁用 - 使用真实 Supabase 登录
    // 如需快速开发模式，可以设置 NEXT_PUBLIC_ENABLE_DEV_MOCK=true
    /*
    if (env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_DEV_MOCK === 'true') {
      const mockUser: User = {
        id: 'dev-admin-id',
        phone: '15601911921',
        name: 'Dev Admin',
        role: 'admin',
        avatar_url: undefined
      };
      setUser(mockUser);
      setLoading(false);
      return;
    }
    */

    // E2E TEST MODE: Mock user session
    if (env.NEXT_PUBLIC_E2E_TEST === 'true') {
      const isTestUserLoggedIn = typeof window !== 'undefined' && localStorage.getItem('e2e-test-user');
      if (isTestUserLoggedIn) {
        const mockUser: User = {
          id: 'e2e-test-user-id',
          phone: '13800138000',
          name: 'E2E Test User',
          role: 'admin',
          avatar_url: undefined
        };
        setUser(mockUser);
        setLoading(false);
        return;
      }
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = {
            id: session.user.id,
            phone: session.user.phone ?? '',
            name: session.user.user_metadata?.name ?? '',
            avatar_url: session.user.user_metadata?.avatar_url,
            role: session.user.user_metadata?.role ?? 'user',
          };
          setUser(userData);
          // Identify user in analytics
          IDENTIFY_USER(session.user.id, {
            role: userData.role,
            phone: userData.phone,
            name: userData.name
          });
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userData = {
          id: session.user.id,
          phone: session.user.phone ?? '',
          name: session.user.user_metadata?.name ?? '',
          avatar_url: session.user.user_metadata?.avatar_url,
          role: session.user.user_metadata?.role ?? 'user',
        };
        setUser(userData);
        // Identify user in analytics
        IDENTIFY_USER(session.user.id, {
          role: userData.role,
          phone: userData.phone,
          name: userData.name
        });
      } else {
        setUser(null);
        RESET_USER();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);



  const login = async (identifier: string, password: string) => {
    try {
      // E2E TEST MOCK
      if (env.NEXT_PUBLIC_E2E_TEST === 'true' && identifier === '13800138000' && password === '123456') {
        localStorage.setItem('e2e-test-user', 'true');
        const mockUser: User = {
          id: 'e2e-test-user-id',
          phone: '13800138000',
          name: 'E2E Test User',
          role: 'admin',
          avatar_url: undefined
        };
        setUser(mockUser);
        router.push('/');
        return;
      }

      // 简单的邮箱格式检查
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

      // 使用Supabase Auth进行登录
      const { error } = await supabase.auth.signInWithPassword({
        ...(isEmail ? { email: identifier } : { phone: identifier }),
        password
      });

      if (error) {
        throw error;
      }

      router.push('/');
    } catch (_error) {
      throw _error;
    }
  };

  // 发送验证码
  const sendVerificationCode = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        throw error;
      }
    } catch (_error) {
      throw _error;
    }
  };

  // 验证码登录
  const loginWithSms = async (phone: string, verificationCode: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: verificationCode,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      router.push('/');
    } catch (_error) {
      throw _error;
    }
  };

  // 第三方登录
  const loginWithThirdParty = async (provider: 'wechat' | 'feishu') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: (provider === 'wechat' ? 'wechat' : 'custom') as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // 飞书需要特殊配置
          ...(provider === 'feishu' && {
            provider: 'custom',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              customParameters: {
                provider: 'feishu',
              },
            },
          }),
        },
      });

      if (error) {
        throw error;
      }
    } catch (_error) {
      throw _error;
    }
  };

  const register = async (phone: string, password: string, name: string) => {
    try {
      // 使用Supabase Auth进行注册（使用手机号）
      const { error } = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            name,
            role: 'user',
          },
        },
      });

      if (error) {
        throw error;
      }

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

      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

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
