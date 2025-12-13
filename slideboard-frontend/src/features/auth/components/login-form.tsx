'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperInput } from '@/components/ui/paper-input';
import { useAuth } from '@/contexts/auth-context';

import { loginSchema, type LoginFormData } from '../schemas/login';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError('');
    try {
      await login(data.identifier, data.password);
      
      // 登录成功后，如果 auth-context 或 onAuthStateChange 没有自动触发跳转
      // 我们可以手动尝试跳转，或者依靠 LoginView 中的 useEffect 来处理
      // 但为了更好的用户体验，这里可以不做额外操作，依赖 LoginView 的 useEffect
      // 如果需要手动跳转，可以取消注释下面这行，但要注意避免重复跳转
      // router.push(searchParams.get('redirectTo') || '/dashboard');
      
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError('登录失败，请检查手机号/邮箱和密码');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {globalError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-error-50 border border-error-200 rounded-md"
          >
            <p className="text-error-600 text-sm">{globalError}</p>
          </motion.div>
        )}

        <PaperInput
          label="手机号 / 邮箱"
          placeholder="请输入手机号或邮箱"
          icon={<Phone className="h-5 w-5" />}
          error={errors.identifier?.message}
          {...register('identifier')}
          autoComplete="username"
        />

        <div className="relative">
          <PaperInput
            label="密码"
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入密码"
            icon={<Lock className="h-5 w-5" />}
            error={errors.password?.message}
            {...register('password')}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-ink-400 hover:text-ink-600 focus:outline-none"
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-theme-border rounded bg-theme-bg-tertiary"
              {...register('rememberMe')}
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

        <PaperButton
            type="submit"
            className="w-full"
            loading={isSubmitting}
            size="lg"
          >
            登录
          </PaperButton>
      </form>
    </motion.div>
  );
}
