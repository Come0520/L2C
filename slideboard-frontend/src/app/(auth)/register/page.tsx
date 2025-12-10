'use client';

import { Eye, EyeOff, Phone, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { useAuth } from '@/contexts/auth-context';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    
    if (typeof error === 'object' && error !== null) {
      // 尝试解析各种常见的错误格式 (Supabase, API 等)
      const err = error as Record<string, unknown>;
      
      // 标准 message 字段
      if (typeof err.message === 'string') return err.message;
      
      // 常见 msg 字段
      if (typeof err.msg === 'string') return err.msg;
      
      // error 字段可能是字符串也可能是对象
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error === 'object' && err.error !== null && 'message' in err.error) {
        return String((err.error as any).message);
      }
    }
    
    return '注册失败，请重试';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { phone, password, confirmPassword, name } = formData;

    if (!phone || !password || !confirmPassword || !name) {
      setError('请填写所有必填字段');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (name.length < 2) {
      setError('姓名长度至少为2位');
      return;
    }

    startTransition(async () => {
      try {
        await register(phone, password, name);
        router.push('/');
      } catch (error: unknown) {
        console.error('注册错误:', error);
        setError(getErrorMessage(error));
      }
    });
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

        {/* Register Form */}
        <div className="bg-theme-bg-secondary rounded-xl shadow-lg border border-theme-border p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-theme-text-primary mb-2">创建账户</h2>
            <p className="text-theme-text-secondary">请填写以下信息完成注册</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-error-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-theme-text-primary mb-2">
                姓名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-theme-text-secondary" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="请输入您的姓名"
                  className="block w-full pl-10 pr-3 py-3 border border-theme-border rounded-lg leading-5 bg-theme-bg-tertiary text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-primary-500/50 transition-all duration-200"
                  maxLength={20}
                  autoComplete="name"
                />
              </div>
            </div>

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
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="请输入手机号"
                  className="block w-full pl-10 pr-3 py-3 border border-theme-border rounded-lg leading-5 bg-theme-bg-tertiary text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-primary-500/50 transition-all duration-200"
                  maxLength={11}
                  autoComplete="tel"
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码（至少6位）"
                  className="block w-full pl-10 pr-10 py-3 border border-theme-border rounded-lg leading-5 bg-theme-bg-tertiary text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-primary-500/50 transition-all duration-200"
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-theme-text-secondary hover:text-theme-text-primary" />
                  ) : (
                    <Eye className="h-5 w-5 text-theme-text-secondary hover:text-theme-text-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-text-primary mb-2">
                确认密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-theme-text-secondary" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="请再次输入密码"
                  className="block w-full pl-10 pr-10 py-3 border border-theme-border rounded-lg leading-5 bg-theme-bg-tertiary text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-primary-500/50 transition-all duration-200"
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-theme-text-secondary hover:text-theme-text-primary" />
                  ) : (
                    <Eye className="h-5 w-5 text-theme-text-secondary hover:text-theme-text-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-theme-border rounded bg-theme-bg-tertiary"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-theme-text-secondary">
                我同意{' '}
                <Link href="#" className="text-primary-600 hover:text-primary-500">
                  服务条款
                </Link>{' '}
                和{' '}
                <Link href="#" className="text-primary-600 hover:text-primary-500">
                  隐私政策
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isPending}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    <span>注册中...</span>
                  </span>
                ) : (
                  '立即注册'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-theme-text-secondary">
              已有账户？{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                立即登录
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-theme-text-secondary">
            注册即表示您同意我们的{' '}
            <Link href="#" className="text-primary-600 hover:text-primary-500">服务条款</Link>{' '}
            和{' '}
            <Link href="#" className="text-primary-600 hover:text-primary-500">隐私政策</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
