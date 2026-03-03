import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';

/**
 * 登录主入口页面
 *
 * @description
 * 纯渲染组件，不做任何服务端 session 检查。
 * - 已登录用户的重定向由 Navbar（「进入工作台」按钮）引导
 * - 未登录用户访问保护路由的拦截由 Middleware 统一处理
 * - 此设计消除了 login ↔ dashboard 之间的 307 重定向死循环
 * - LoginForm 使用 useSearchParams()，必须被 Suspense 包裹以支持 SSG 预渲染
 */
export default function LoginPage() {
  return (
    <div className="w-full">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
