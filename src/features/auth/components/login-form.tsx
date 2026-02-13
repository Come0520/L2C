'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

/**
 * 登录表单组件 (Aceternity UI 风格)
 * 功能：
 * - 手机号/邮箱 + 密码登录
 * - 密码显示/隐藏切换
 * - 注册入口链接
 * - 忘记密码链接
 */
export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('登录失败：用户名或密码错误');
      } else {
        toast.success('登录成功');
        router.push('/');
        router.refresh();
      }
    } catch (_error) {
      toast.error('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl dark:bg-black/40">
      {/* 标题区域 */}
      <h2 className="text-center text-2xl font-bold text-neutral-800 dark:text-neutral-200">
        欢迎回到 L2C 系统
      </h2>
      <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
        线索到现金，一站式销售管理
      </p>

      {/* 表单 */}
      <form className="mt-8" onSubmit={handleSubmit}>
        {/* 用户名/邮箱 */}
        <LabelInputContainer className="mb-4">
          <Label htmlFor="username" className="text-neutral-700 dark:text-neutral-300">
            手机号 / 邮箱
          </Label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              id="username"
              type="text"
              placeholder="请输入手机号或邮箱"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input pl-10"
              required
            />
          </div>
        </LabelInputContainer>

        {/* 密码 */}
        <LabelInputContainer className="mb-2">
          <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">
            密码
          </Label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input pr-10 pl-10"
              required
            />
            {/* 密码显示/隐藏切换按钮 */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
              tabIndex={-1}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </LabelInputContainer>

        {/* 忘记密码链接 */}
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => toast.info('请联系管理员重置密码')}
            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm transition-colors"
          >
            忘记密码？
          </button>
        </div>

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={isLoading}
          className="group/btn from-primary-600 to-primary-700 shadow-primary-500/30 hover:from-primary-500 hover:to-primary-600 relative block h-11 w-full rounded-xl bg-gradient-to-br font-medium text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center justify-center">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? '登录中...' : '登录'}
          </span>
          <BottomGradient />
        </button>

        {/* 分割线 */}
        <div className="my-6 flex items-center">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
          <span className="px-4 text-sm text-neutral-500">或</span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
        </div>

        {/* 注册链接 */}
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          还没有账号？{' '}
          <Link
            href="/register/tenant"
            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium underline-offset-4 transition-colors hover:underline"
          >
            立即注册
          </Link>
        </p>
      </form>
    </div>
  );
}

/**
 * 底部渐变动效 (Aceternity UI 特效)
 */
const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

/**
 * 输入框容器组件
 */
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn('flex w-full flex-col space-y-2', className)}>{children}</div>;
};
