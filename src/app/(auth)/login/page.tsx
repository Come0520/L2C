import { LoginForm } from '@/features/auth/components/login-form';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';

/**
 * 登录主入口页面 (服务端控制反转)
 *
 * @description
 * 1. 预检：首先进行服务端会话检查（带容错）。
 * 2. 拦截：如果用户已登录且 session 完整（含 tenantId），则重定向至首页。
 * 3. 容错：如果 auth() 抛出异常或 session 不完整，降级为渲染登录表单，
 *    避免与 dashboard layout 形成 307 重定向死循环。
 */
export default async function LoginPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // auth() 在反代环境下可能因 CSRF/cookie 问题抛出异常
    // 降级为未登录状态，直接渲染登录表单
  }

  // 仅当 session 完整有效时才跳转（防止死循环）
  if (session?.user?.id && session?.user?.tenantId) {
    redirect('/dashboard');
  }

  return (
    <div className="w-full">
      <LoginForm />
    </div>
  );
}

