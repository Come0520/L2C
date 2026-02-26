import { LoginForm } from '@/features/auth/components/login-form';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';

/**
 * 登录主入口页面 (服务端控制反转)
 *
 * @description
 * 1. 预检：首先进行服务端会话检查。
 * 2. 拦截：如果用户已登录，则直接重定向至首页 `/`，防止重复渲染登录表单。
 * 3. 渲染：未登录状态下渲染 `LoginForm` 客户端组件。
 */
export default async function LoginPage() {
  const session = await auth();

  // 已登录，跳转到首页
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="w-full">
      <LoginForm />
    </div>
  );
}
