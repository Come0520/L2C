'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import Link from 'next/link';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/logger';

/**
 * 登录表单验证 Schema
 */
const loginSchema = z.object({
  username: z.string().min(1, '请输入手机号或邮箱'),
  password: z.string().min(1, '请输入密码'),
});

/**
 * 登录表单核心组件
 * 
 * 视觉风格：基于 Aceternity UI 的毛玻璃特效 (Glassmorphism)。
 * 核心功能：
 * 1. 凭证登录：支持手机号/邮箱 + 密码的组合校验。
 * 2. 交互增强：密码明文切换、加载状态反馈、全表单错误提示。
 * 3. 页面导流：关联注册流程 (Tenant Registration) 及忘记密码提示。
 * 
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod 安全校验
    const validation = loginSchema.safeParse({ username, password });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || '请完善登录信息');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // 触发抖动反馈
        setHasError(true);
        setTimeout(() => setHasError(false), 500);

        // 细化错误反馈
        const errorMsg = result.error === 'CredentialsSignin'
          ? '登录失败：用户名或密码错误'
          : `登录失败: ${result.error}`;

        logger.warn('[Auth:Login] 登录凭证校验失败', {
          username: username.replace(/(.{3}).*(.{2})/, '$1***$2'),
          error: result.error
        });

        toast.error(errorMsg);
      } else {
        toast.success('登录成功，欢迎回来');
        router.push('/');
        router.refresh();
      }
    } catch (_err: unknown) {
      logger.error('[Auth:Login] 登录执行异常', {
        error: _err instanceof Error ? _err.message : String(_err),
        timestamp: new Date().toISOString()
      });
      toast.error('网络连接异常，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "shadow-input mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl dark:bg-black/40 transition-all duration-300",
      hasError && "animate-shake ring-2 ring-red-500/50"
    )}>
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
            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
            <Input
              id="username"
              type="text"
              placeholder="请输入手机号或邮箱"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input pl-10"
              required
              aria-required="true"
              autoComplete="username"
            />
          </div>
        </LabelInputContainer>

        {/* 密码 */}
        <LabelInputContainer className="mb-2">
          <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">
            密码
          </Label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input pr-10 pl-10"
              required
              aria-required="true"
              autoComplete="current-password"
            />
            {/* 密码显示/隐藏切换按钮 */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
              tabIndex={-1}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
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
          aria-busy={isLoading}
          className="group/btn from-primary-600 to-primary-700 shadow-primary-500/30 hover:from-primary-500 hover:to-primary-600 relative block h-11 w-full rounded-xl bg-linear-to-br font-medium text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center justify-center">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? '登录中...' : '登录'}
          </span>
          <BottomGradient />
        </button>

        {/* 分割线 */}
        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
          <span className="px-4 text-sm text-neutral-500">或</span>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
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
 * 渲染两条水平渐变线，配合 hover 效果增强按钮的视觉感知度。
 */
const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

/**
 * 输入框容器组件
 * 
 * @description 垂直布局包装容器，统一管理 Label 和 Input 的间距。
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
