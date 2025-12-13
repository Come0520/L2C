'use client';

import { Eye, EyeOff, Phone, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('请填写手机号/邮箱和密码');
      return;
    }

    // 验证是否为有效的邮箱或手机号
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^1[3-9]\d{9}$/.test(identifier);

    if (!isEmail && !isPhone) {
      setError('请输入正确的手机号或邮箱');
      return;
    }

    setIsLoading(true);

    try {
      await login(identifier, password);
      router.push('/dashboard');
    } catch (error) {
      setError('登录失败，请检查手机号/邮箱和密码');
      console.error('登录错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-200 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-success-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-paper-lg">
            <span className="text-white font-bold text-xl">L2C</span>
          </div>
          <h1 className="text-3xl font-bold text-ink-800 mb-2">销售管理系统</h1>
          <p className="text-ink-500">暖宣纸主题 · 现代化销售管理</p>
        </div>

        {/* Login Form */}
        <PaperCard className="shadow-paper-xl">
          <PaperCardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-ink-800 mb-2">欢迎回来</h2>
              <p className="text-ink-500">请登录您的账户</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error-100 border border-error-200 rounded-lg">
                <p className="text-error-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Input */}
              <PaperInput
                id="identifier"
                type="text"
                label="手机号 / 邮箱"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="请输入手机号或邮箱"
                required
                icon={<Phone className="h-5 w-5 text-ink-400" />}
              />

              {/* Password Input */}
              <div className="relative">
                <PaperInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  icon={<Lock className="h-5 w-5 text-ink-400" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Remember me and Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-success-500 focus:ring-success-400 border-paper-600 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-ink-600">
                    记住我
                  </label>
                </div>
                <div className="text-sm">
                  <Link href="#" className="font-medium text-success-600 hover:text-success-700">
                    忘记密码？
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <PaperButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </PaperButton>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-ink-600">
                还没有账户？{' '}
                <Link href="/auth/register" className="font-medium text-success-600 hover:text-success-700">
                  立即注册
                </Link>
              </p>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-ink-500">
            登录即表示您同意我们的{' '}
            <Link href="#" className="text-success-600 hover:text-success-700">服务条款</Link>{' '}
            和{' '}
            <Link href="#" className="text-success-600 hover:text-success-700">隐私政策</Link>
          </p>
        </div>

        {/* 宣纸纹理装饰 */}
        <div className="fixed inset-0 pointer-events-none opacity-5">
          <div className="w-full h-full bg-paper-texture bg-repeat" />
        </div>
      </div>
    </div>
  );
}