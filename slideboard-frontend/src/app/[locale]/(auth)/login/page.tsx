'use client';

import { Eye, EyeOff, Phone, Lock, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

  // 发送验证码倒计时
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
    } catch (error: any) {
      setError(error.message || '验证码发送失败');
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
      setError('请填写手机号和密码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setIsLoading(true);

    try {
      await login(phone, password);
    } catch (error: any) {
      setError(error.message || '登录失败,请检查手机号和密码');
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
    } catch (error: any) {
      setError(error.message || '登录失败，请检查验证码');
    } finally {
      setIsLoading(false);
    }
  };

  // 第三方登录
  const handleThirdPartyLogin = (provider: 'wechat' | 'feishu') => {
    setError('');
    try {
      loginWithThirdParty(provider);
    } catch (error: any) {
      setError(error.message || `${provider === 'wechat' ? '微信' : '飞书'}登录失败`);
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
              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-theme-text-primary mb-2">
                  手机号
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-theme-text-secondary" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    required
                    maxLength={11}
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
                  <path d="M20.5 3.5c-.4-.4-1-.4-1.4 0l-16 16c-.4.4-.4 1 0 1.4s1 .4 1.4 0l1.04-1.04a9.95 9.95 0 0 0 6.02 2.17c5.52 0 10-4.48 10-10 0-2.77-.99-5.3-2.64-7.25l1.04-1.04zM13 1.99c3.87 0 7 3.13 7 7 0 3.13-2.07 5.83-5 6.71v-2.08c1.72-.86 3-2.69 3-4.63 0-2.21-1.79-4-4-4-2.21 0-4 1.79-4 4 0 1.19.63 2.27 1.58 2.83L10 14.17V17c-3.03-.89-5-3.58-5-6.71 0-3.87 3.13-7 7-7z"></path>
                </svg>
                微信登录
              </button>
              <button
                onClick={() => handleThirdPartyLogin('feishu')}
                className="flex items-center gap-2 px-4 py-2 border border-theme-border rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm3.84 16.88c-.48.32-1.04.56-1.64.72-.36.08-.72.12-1.12.12-.32 0-.64-.04-.96-.12-.64-.16-1.16-.4-1.6-.72-.16-.12-.32-.24-.48-.36-.12-.12-.24-.24-.32-.36-.08-.12-.12-.24-.16-.36-.04-.12-.04-.24-.04-.36 0-.12 0-.24.04-.36.04-.12.08-.24.16-.36.08-.12.2-.24.32-.36.16-.12.32-.24.48-.36.44-.32.96-.56 1.6-.72.64-.16 1.28-.24 2-.24.72 0 1.36.08 2 .24.64.16 1.16.4 1.6.72.16.12.32.24.48.36.12.12.24.24.32.36.08.12.12.24.16.36.04.12.04.24.04.36 0 .12 0 .24-.04.36-.04.12-.08.24-.16.36-.08.12-.2.24-.32.36-.16.12-.32.24-.48.36zm-3.84-2.4c-2.48 0-4.48 1.6-5.2 3.68h10.4c-.72-2.08-2.72-3.68-5.2-3.68zm0-4.8c-1.36 0-2.48.88-2.88 2.08H14.88c-.4-1.2-1.52-2.08-2.88-2.08zm0-4.8c-1.36 0-2.48.88-2.88 2.08H14.88c-.4-1.2-1.52-2.08-2.88-2.08z"></path>
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
