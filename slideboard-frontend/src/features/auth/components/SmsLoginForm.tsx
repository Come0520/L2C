'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { MessageSquare, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperInput } from '@/components/ui/paper-input';
import { useAuth } from '@/contexts/auth-context';

import { smsLoginSchema, type SmsLoginFormData } from '../schemas/login';

export function SmsLoginForm() {
  const [globalError, setGlobalError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  
  const { loginWithSms, sendVerificationCode } = useAuth();

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SmsLoginFormData>({
    resolver: zodResolver(smsLoginSchema),
    defaultValues: {
      phone: '',
      code: '',
    },
  });

  // 倒计时逻辑
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

  const handleSendCode = async () => {
    setGlobalError('');
    const phone = getValues('phone');
    
    // 验证手机号
    const isPhoneValid = await trigger('phone');
    if (!isPhoneValid) return;

    setIsSendingCode(true);
    try {
      await sendVerificationCode(phone);
      setCountdown(60);
    } catch (error: any) {
      console.error('Send code failed:', error);
      if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError('验证码发送失败，请稍后重试');
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (data: SmsLoginFormData) => {
    setGlobalError('');
    try {
      await loginWithSms(data.phone, data.code);
      // Success handled by auth-context / page redirect
    } catch (error: any) {
      console.error('SMS Login failed:', error);
      if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError('登录失败，请检查验证码');
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
            label="验证码"
            type="text"
            placeholder="请输入6位验证码"
            icon={<MessageSquare className="h-5 w-5" />}
            error={errors.code?.message}
            {...register('code')}
            maxLength={6}
            autoComplete="one-time-code"
            // Adjust padding right for the button
             className="pr-24" 
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isSendingCode || countdown > 0}
            className="absolute right-3 top-[34px] text-primary-600 hover:text-primary-700 text-sm font-medium disabled:text-theme-text-secondary disabled:cursor-not-allowed transition-colors"
          >
            {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
          </button>
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
