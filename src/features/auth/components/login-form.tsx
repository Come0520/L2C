'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
 * ============================================================================
 * L2C Auth Module: Login Form Component
 * ============================================================================
 * 本文件负责渲染系统统一的登录表单界面，并处理基于凭证 (Credentials) 的身份认证交互。
 */

/**
 * 登录表单 Zod 验证 Schema
 *
 * @description 定义登录表单的前端校验规则，在组件提交时触发。
 * 主要对用户名和密码进行非空校验，避免发出无效的认证请求。
 * - username: 支持手机号或邮箱，不能为空。
 * - password: 密码字段，不能为空。
 *
 * @see {@link LoginForm} 使用此 Schema 进行表单提交前客户端校验。
 * @see {@link LoginCredentials} 基于此 Schema 提取的类型别名。
 */
const loginSchema = z.object({
  /**
   * 用户名字段
   * @description 支持手机号或邮箱格式输入。min(1) 确保此项不是空串。
   */
  username: z.string().min(1, '请输入手机号或邮箱'),

  /**
   * 密码字段
   * @description 用户密码输入。安全要求不在前端做弱密码拦截，交由后端统一判定。
   */
  password: z.string().min(1, '请输入密码'),
});

/**
 * 登录凭证类型定义
 *
 * @description 由 loginSchema 推导出的 TypeScript 类型，
 * 确保表单的结构化数据与 Zod 校验规则保持类型一致。
 */
type LoginCredentials = z.infer<typeof loginSchema>;

/**
 * 登录表单核心组件 (LoginForm)
 *
 * @description
 * 视觉风格：基于 Aceternity UI 的毛玻璃特效 (Glassmorphism)。
 *
 * 核心功能：
 * 1. 凭证登录：支持手机号/邮箱 + 密码的组合校验。
 * 2. 交互增强：提供密码明文与密文的按需切换机制。
 * 3. 加载反馈：请求期间禁用按钮并展示加载动画，防止多次连击。
 * 4. 错误处理：登录失败触发全体表单的视觉抖动提示，并在屏幕出现 Toast 报错。
 * 5. 页面导流：关联注册流程 (Tenant Registration) 及忘记密码提示。
 *
 * @returns {JSX.Element} 渲染后的登录表单 JSX 元素区域。
 *
 * @example
 * ```tsx
 * // 在 Auth Layout 下渲染登录模块：
 * <main className="flex min-h-screen">
 *   <div className="m-auto"><LoginForm /></div>
 * </main>
 * ```
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  /**
   * 表单提交期间的加载状态控制器
   *
   * @description 为 true 时，Input 和 Button 也会呈现不可交互状态，
   * 同时 Button 文字区域增加一个 Loader2 SVG 的旋转动画。
   * 防止用户在登录接口卡顿时重复发起认证请求，减少服务器压力。
   *
   * @type {boolean}
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 用户名/邮箱输入框受控值
   *
   * @description React 受控组件状态，捕捉用户实时输入，作为凭证之一。
   *
   * @type {string}
   */
  const [username, setUsername] = useState('');

  /**
   * 密码输入框受控值
   *
   * @description React 受控组件状态，捕捉用户实时键入的密码，作为关键凭证。
   *
   * @type {string}
   */
  const [password, setPassword] = useState('');

  /**
   * 密码文本可见性开关
   *
   * @description 控制密码 Input 的 type 属性在 'text' 和 'password' 之间切换。
   * 默认处于 false (即 password 隐藏) 状态。
   *
   * @type {boolean}
   */
  const [showPassword, setShowPassword] = useState(false);

  /**
   * 登录表单全局错误视觉抖动反馈标志
   *
   * @description 当从 Auth Server 获得明确或非预期的失败结果时被置为 true。
   * 将向最外层容器插入 "animate-shake" CSS 类和红色边框予以告警。
   * 在执行过 500 毫秒的副作用后恢复至 false。
   *
   * @type {boolean}
   */
  const [hasError, setHasError] = useState(false);

  /**
   * 处理全表单事件提交流程
   *
   * @description 阻断了 form 原生 action 之后：
   * 1. 使用预定义的 Zod Schema 进行前端拦截验证。
   * 2. 调用 next-auth 提供的高级 signIn 函数（策略：credentials）。
   * 3. redirect 设置为 false，使得错误反馈可以不刷新页面，平滑在组件内呈现。
   * 4. 无论成功与否都要移除局部 isLoading 锁。
   *
   * @param {React.FormEvent} e - React 表单标准提交事件
   *
   * @security 日志中的用户名必须使用正则脱敏处理，仅保留首尾字符，避免手机号泄露。
   * @security error message 信息会被清洗之后再展示给前端 (防信息刺探)。
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    /**
     * 客户端侧边界数据拦截
     * @description 若失败则抛出 Toast 吐司阻止请求出栈
     */
    const validation = loginSchema.safeParse({ username, password });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || '请完善登录信息');
      return;
    }

    setIsLoading(true);

    try {
      /**
       * 调用 next-auth 原生凭证登录体系
       *
       * @description redirect: false 表示不自动导航走，方便处理 Error。
       */
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        /**
         * 登录失败后续处理：
         * 设置 hasError === true，随后利用定时器归位。
         */
        setHasError(true);
        setTimeout(() => setHasError(false), 500);

        /**
         * 分级错误提示机制
         *
         * @description 将 'CredentialsSignin' 这类晦涩的 OAuth 原生报错映射为用户能够理解的中文文案。
         */
        const errorMsg = result.error.includes('SYSTEM_ERROR')
          ? '系统繁忙，请稍后重试'
          : result.error === 'CredentialsSignin'
            ? '登录失败：用户名或密码错误'
            : `登录失败: ${result.error}`;

        /**
         * 在系统监控中留痕
         * @description 使用正则保护终端用户注册账户等敏感信息。
         */
        logger.warn('[Auth:Login] 登录凭证校验失败', {
          username: username.replace(/(.{3}).*(.{2})/, '$1***$2'),
          error: result.error,
        });

        toast.error(errorMsg);
      } else {
        toast.success('登录成功，欢迎回来');
        /**
         * 登录成功后使用的硬跳转机制
         *
         * @description 使用 window.location.href 直接拉取新页面，
         * 而非 next/router，以防有些边缘情况 Next.js Navigation 未能触发 Auth Cookie 的重新载入。
         */
        window.location.href = callbackUrl;
      }
    } catch (_err: unknown) {
      /**
       * 极少出现的底层客户端崩溃或断网捕获
       */
      logger.error('[Auth:Login] 登录执行异常', {
        error: _err instanceof Error ? _err.message : String(_err),
        timestamp: new Date().toISOString(),
      });
      toast.error('网络连接异常，请稍后重试');
    } finally {
      /** 解除锁定状态 */
      setIsLoading(false);
    }
  };

  /**
   * 表单主渲染层
   */
  return (
    <div
      className={cn(
        'shadow-input mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl transition-all duration-300 dark:bg-black/40',
        hasError && 'animate-shake ring-2 ring-red-500/50'
      )}
    >
      {/* ======================================================= */}
      {/* 标题说明区域 */}
      {/* ======================================================= */}
      <h2 className="text-center text-2xl font-bold text-neutral-800 dark:text-neutral-200">
        欢迎回到 L2C 系统
      </h2>
      <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
        线索到现金，一站式销售管理
      </p>

      {/* ======================================================= */}
      {/* 表格容器区 */}
      {/* ======================================================= */}
      <form className="mt-8" onSubmit={handleSubmit}>
        {/* 用户名或邮箱入参结构组 */}
        <LabelInputContainer className="mb-4">
          <Label htmlFor="username" className="text-neutral-700 dark:text-neutral-300">
            手机号 / 邮箱
          </Label>
          <div className="relative">
            <Mail
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            />
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

        {/* 敏感密码入参结构组 */}
        <LabelInputContainer className="mb-2">
          <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">
            密码
          </Label>
          <div className="relative">
            <Lock
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            />
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

            {/* 眼球图标按钮，控制 type 状态变动 */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
              tabIndex={-1}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </LabelInputContainer>

        {/* ======================================================= */}
        {/* 指引链接行：找回密码路由引导 */}
        {/* ======================================================= */}
        <div className="mb-6 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm transition-colors"
          >
            忘记密码？
          </Link>
        </div>

        {/* ======================================================= */}
        {/* 表单核心提交器按钮 */}
        {/* ======================================================= */}
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

        {/* ======================================================= */}
        {/* 下半场分隔与注册跳点 */}
        {/* ======================================================= */}
        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
          <span className="px-4 text-sm text-neutral-500">或</span>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
        </div>

        {/* 新人注册分支引导口 */}
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
 * 底部渐变动效组件 (Aceternity UI 特效衍生装点对象)
 *
 * @description
 * 渲染两条水平重影线条，与父级元素的 `group-hover/btn` 状态联动触发视觉响应。
 * 使用 CSS transition 平滑调度 opacity 和 blur 滤镜实现流光溢彩的感觉。
 *
 * @returns {JSX.Element} 两条叠加的渐变动效片段
 */
const BottomGradient = () => {
  return (
    <>
      {/** 主水平面横展的高光青色渐变线 */}
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      {/** 辅助加持的底层失焦模糊紫蓝色辉光 */}
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

/**
 * 局部统筹复用组件：表单上下元素对准排版容器 (LabelInputContainer)
 *
 * @description
 * 统一承接任何带有 Label + Input 的行级内容块，维护统一的 flex col 及其间隙。
 * 是 Aceternity 体系组件规范提倡的一种纯粹排版层外包围技术手段。
 *
 * @param {object} props - 注入容器的组件参数及内容
 * @param {React.ReactNode} props.children - DOM 子树，主要是 Input 加 Label 以内的杂项
 * @param {string} [props.className] - 外包的 tailwind custom 类以便进一步覆盖或加码间距
 *
 * @returns {JSX.Element} 带有 flex y-axis 结构的 div 树块
 */
const LabelInputContainer = ({
  children,
  className,
}: {
  /** 期望的元素列表内容 */
  children: React.ReactNode;
  /** 可拓展自定义前置样板 className 的字面字段 */
  className?: string;
}) => {
  return <div className={cn('flex w-full flex-col space-y-2', className)}>{children}</div>;
};
