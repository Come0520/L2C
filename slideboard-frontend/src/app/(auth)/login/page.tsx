'use client';

import { Eye, EyeOff, Phone, Lock, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/auth-context';

type LoginMethod = 'password' | 'sms' | 'third-party';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const { login, loginWithSms, sendVerificationCode, loginWithThirdParty } = useAuth();
  const router = useRouter();

  // 修复倒计时逻辑：使用 useEffect 管理倒计时，避免内存泄漏
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(60);
  };

  // 辅助函数：安全获取错误信息
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return '发生未知错误';
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      await sendVerificationCode(phone);
      startCountdown();
      setError('验证码发送成功');
    } catch (error: unknown) {
      setError(getErrorMessage(error) || '验证码发送失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 密码登录提交
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 手机号登录
    if (!phone || !password) {
      setError('请填写手机号/邮箱和密码');
      return;
    }

    // 简单检查非空即可，具体格式交给后端或 supabase
    if (!phone) {
      setError('请输入正确的手机号或邮箱');
      return;
    }

    setIsLoading(true);

    try {
      await login(phone, password);
    } catch (error: unknown) {
      setError(getErrorMessage(error) || '登录失败,请检查手机号和密码');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码登录提交
  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || !verificationCode) {
      setError('请填写手机号和验证码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      setError('请输入6位数字验证码');
      return;
    }

    setIsLoading(true);

    try {
      await loginWithSms(phone, verificationCode);
    } catch (error: unknown) {
      setError(getErrorMessage(error) || '登录失败，请检查验证码');
    } finally {
      setIsLoading(false);
    }
  };

  // 第三方登录
  const handleThirdPartyLogin = (provider: 'wechat' | 'feishu') => {
    setError('');
    try {
      loginWithThirdParty(provider);
    } catch (error: unknown) {
      setError(getErrorMessage(error) || `${provider === 'wechat' ? '微信' : '飞书'}登录失败`);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">Slideboard</h1>
          <p className="text-theme-text-secondary">现代化幻灯片展示平台</p>
        </div>

        {/* Login Form */}
        <div className="bg-theme-bg-secondary rounded-xl shadow-lg border border-theme-border p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-theme-text-primary mb-2">欢迎回来</h2>
            <p className="text-theme-text-secondary">请登录您的账户</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
              <p className="text-error-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Method Tabs */}
          <div className="flex mb-6 border-b border-theme-border">
            <button
              onClick={() => setLoginMethod('password')}
              className={`py-2 px-4 font-medium text-sm ${loginMethod === 'password' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-theme-text-secondary hover:text-theme-text-primary'}`}
            >
              密码登录
            </button>
            <button
              onClick={() => setLoginMethod('sms')}
              className={`py-2 px-4 font-medium text-sm ${loginMethod === 'sms' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-theme-text-secondary hover:text-theme-text-primary'}`}
            >
              验证码登录
            </button>
          </div>

          {/* Password Login Form */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              {/* Identifier Input */}
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-theme-text-primary mb-2">
                  手机号 / 邮箱
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-theme-text-secondary" />
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    value={phone} // Keeping state name 'phone' for now to minimize refactor, but it holds identifier
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号或邮箱"
                    required
                    autoComplete="username"
                    className="block w-full pl-10 pr-3 py-3 border border-theme-border rounded-lg leading-5 bg-theme-bg-tertiary text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-theme-text-primary mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-theme-text-secondary" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    required
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-3 border border-theme-border rounded-lg leading-5 bg-theme-bg-tertiary text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-theme-text-secondary hover:text-theme-text-primary" />
                    ) : (
                      <Eye className="h-5 w-5 text-theme-text-secondary hover:text-theme-text-primary" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me and Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-theme-border rounded bg-theme-bg-tertiary"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-theme-text-secondary">
                    记住我
                  </label>
                </div>
                <div className="text-sm">
                  <Link href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    忘记密码？
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? (
                    '登录中...'
                  ) : (
                    '登录'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* SMS Login Form */}
          {loginMethod === 'sms' && (
            <form onSubmit={handleSmsLogin} className="space-y-6">
              {/* Phone Input */}
              <div>
                <label htmlFor="sms-phone" className="block text-sm font-medium text-theme-text-primary mb-2">
                  手机号
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-theme-text-secondary" />
                  </div>
                  <input
                    id="sms-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    required
                    maxLength={11}
                    autoComplete="tel"
                    className="block w-full pl-10 pr-3 py-3 border border-theme-border rounded-lg leading-5 bg-theme-bg-tertiary text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Verification Code Input */}
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-theme-text-primary mb-2">
                  验证码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-theme-text-secondary" />
                  </div>
                  <input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="请输入6位验证码"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="block w-full pl-10 pr-24 py-3 border border-theme-border rounded-lg leading-5 bg-theme-bg-tertiary text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSendingCode || countdown > 0}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium disabled:text-theme-text-secondary"
                  >
                    {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? (
                    '登录中...'
                  ) : (
                    '登录'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Third Party Login */}
          <div className="mt-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex-grow h-px bg-theme-border"></div>
              <span className="px-4 text-theme-text-secondary text-sm">或使用第三方登录</span>
              <div className="flex-grow h-px bg-theme-border"></div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleThirdPartyLogin('wechat')}
                className="flex items-center gap-2 px-4 py-2 border border-theme-border rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.35 9.17c0-3.65-4.22-6.63-9.43-6.63-5.2 0-9.43 2.98-9.43 6.63 0 2.21 1.54 4.18 3.94 5.45l-.99 3.01 3.65-1.92c.88.23 1.82.36 2.78.36.13 0 .25 0 .38 0-.1-.48-.15-.97-.15-1.46 0-4.04 3.79-7.31 8.46-7.31.26 0 .52.01.78.04zm-3.42 2.06c-3.94 0-7.13 2.81-7.13 6.27 0 1.95 1.08 3.68 2.76 4.83l-.63 2.29 2.78-1.39c.69.19 1.42.3 2.18.3 3.94 0 7.13-2.81 7.13-6.27 0-3.46-3.19-6.27-7.13-6.27z"></path>
                </svg>
                微信登录
              </button>
              <button
                onClick={() => handleThirdPartyLogin('feishu')}
                className="flex items-center gap-2 px-4 py-2 border border-theme-border rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.64 3.53a3.57 3.57 0 0 1 4.54-.5l8.77 6.42a1.68 1.68 0 0 1 .28 2.58l-5.6 6.78a3.56 3.56 0 0 1-5.1.4l-3.27-3.2a1.07 1.07 0 0 1-.22-1.18l2.25-6.65c.34-1 .4-1.63-1.65-3.66a1.07 1.07 0 0 0-.96-.28L1.6 6.2a1.07 1.07 0 0 1-.58-1.9L9.4 1.25a3.57 3.57 0 0 1 2.24-.72z"></path>
                </svg>
                飞书登录
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-theme-text-secondary">
              还没有账户？{' '}
              <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                立即注册
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-theme-text-secondary">
            登录即表示您同意我们的{' '}
            <Link href="#" className="text-primary-600 hover:text-primary-500">服务条款</Link>{' '}
            和{' '}
            <Link href="#" className="text-primary-600 hover:text-primary-500">隐私政策</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
