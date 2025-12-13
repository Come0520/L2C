'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { siteConfig } from '@/config/site';

import { RegisterForm } from './register-form';

export function RegisterView() {
  const router = useRouter();

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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-primary-600 mb-2">{siteConfig.shortName}</h1>
            <p className="text-theme-text-secondary">{siteConfig.description}</p>
          </motion.div>
        </div>

        {/* Register Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-theme-bg-secondary rounded-xl shadow-lg border border-theme-border p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-theme-text-primary mb-2">创建账户</h2>
            <p className="text-theme-text-secondary">请填写以下信息完成注册</p>
          </div>

          <RegisterForm />

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-theme-text-secondary">
              已有账户？{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                立即登录
              </Link>
            </p>
          </div>
        </motion.div>

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
