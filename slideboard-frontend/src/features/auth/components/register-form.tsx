'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCheckbox } from '@/components/ui/paper-checkbox';
import { PaperInput } from '@/components/ui/paper-input';
import { useAuth } from '@/contexts/auth-context';

import { registerSchema, type RegisterFormData } from '../schemas/register';

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      if (typeof err.message === 'string') return err.message;
      if (typeof err.msg === 'string') return err.msg;
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error === 'object' && err.error !== null && 'message' in err.error) {
        return String((err.error as any).message);
      }
    }
    
    return '注册失败，请重试';
  };

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError('');
    try {
      await registerUser(data.phone, data.password, data.name);
      router.push('/');
    } catch (error: any) {
      console.error('Registration failed:', error);
      setGlobalError(getErrorMessage(error));
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
          label="姓名"
          placeholder="请输入您的姓名"
          icon={<User className="h-5 w-5" />}
          error={errors.name?.message}
          {...register('name')}
          maxLength={20}
          autoComplete="name"
        />

        <PaperInput
          label="手机号"
          type="tel"
          placeholder="请输入手机号"
          icon={<Phone className="h-5 w-5" />}
          error={errors.phone?.message}
          {...register('phone')}
          maxLength={11}
          autoComplete="tel"
        />

        <div className="relative">
          <PaperInput
            label="密码"
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入密码（至少6位）"
            icon={<Lock className="h-5 w-5" />}
            error={errors.password?.message}
            {...register('password')}
            autoComplete="new-password"
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

        <div className="relative">
          <PaperInput
            label="确认密码"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="请再次输入密码"
            icon={<Lock className="h-5 w-5" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[34px] text-ink-400 hover:text-ink-600 focus:outline-none"
            aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        <div>
          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-theme-border rounded bg-theme-bg-tertiary"
              {...register('terms')}
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
          {errors.terms && (
            <p className="mt-1 text-sm text-error-600">{errors.terms.message}</p>
          )}
        </div>

        <PaperButton
          type="submit"
          fullWidth
          loading={isSubmitting}
          size="lg"
        >
          立即注册
        </PaperButton>
      </form>
    </motion.div>
  );
}
