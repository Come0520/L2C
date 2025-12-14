'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { siteConfig } from '@/config/site';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

import { LoginForm } from './LoginForm';
import { SocialLogin } from './SocialLogin';

export function LoginView() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessingFeishu, setIsProcessingFeishu] = useState(false);

  // 处理错误信息
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(decodeURIComponent(error));
      // 清除 URL 中的 error 参数
      router.replace('/login');
    }
  }, [searchParams, router]);

  // 处理飞书扫码登录回调
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // 如果 URL 中有 code，且没有正在处理，则尝试飞书登录
    // 注意：这里简单假设 code 是飞书的，如果还有其他 OAuth，需要通过 state 区分
    if (code && !isProcessingFeishu) {
      // 只有 state 为 feishu_login 或者 state 为空(兼容)时才处理
      if (state && state !== 'feishu_login') return;

      handleFeishuCallback(code);
    }
  }, [searchParams]);

  const handleFeishuCallback = async (code: string) => {
    setIsProcessingFeishu(true);
    const toastId = toast.loading('正在验证飞书登录...');

    try {
      // 调用后端 API 交换 token
      const res = await fetch('/api/auth/callback/feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || '登录失败');
      }

      if (data.session) {
        // 设置 Supabase 会话
        const supabase = createClient();
        const { error: sessionError } = await supabase.auth.setSession(data.session);

        if (sessionError) {
          throw new Error('设置会话失败: ' + sessionError.message);
        }

        toast.success('登录成功', { id: toastId });

        // 登录成功后，清除 URL 参数并跳转
        // AuthContext 会自动监听页面状态变化，但为了保险，我们也可以手动跳转
        router.replace('/dashboard');
      } else {
        throw new Error('未返回会话信息');
      }

    } catch (err: any) {
      console.error('飞书登录失败:', err);
      toast.error(err.message || '飞书登录失败', { id: toastId });
      setIsProcessingFeishu(false);
      // 失败后清除 URL 参数，避免循环
      router.replace('/login');
    }
  };

  // 用户登录状态的重定向逻辑已移至auth-context中统一处理
  // 这里保持组件简洁，只负责UI渲染

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      <div className="max-w-md w-full relative z-10">
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-primary-600 mb-2">{siteConfig.shortName}</h1>
            <p className="text-theme-text-secondary">{siteConfig.description}</p>
          </motion.div>
        </div>

        {/* Login Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-theme-bg-secondary/95 backdrop-blur-sm rounded-xl shadow-lg border border-theme-border p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-theme-text-primary mb-2">欢迎回来</h2>
            <p className="text-theme-text-secondary">请登录您的账户</p>
          </div>

          {isProcessingFeishu && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-xl">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-primary-600 font-medium">正在通过飞书登录...</p>
            </div>
          )}

          <LoginForm />

          <SocialLogin />

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-theme-text-secondary">
              还没有账户？{' '}
              <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                立即注册
              </Link>
            </p>
          </div>
        </motion.div>

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
