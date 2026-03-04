'use client';

/**
 * 移动端个人中心页面
 */

import { useMobileAuth } from '@/shared/auth/mobile-auth-context';
import { Button } from '@/shared/ui/button';
import { LogOut, User, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MobileProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useMobileAuth();

  // 未登录跳转
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/mobile/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* 用户信息卡片 */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {user.name || '未设置昵称'}
            </h2>
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Phone className="h-4 w-4" />
              <span>{user.phone || '未绑定手机'}</span>
            </div>
            <span className="mt-2 inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
              {user.role === 'WORKER'
                ? '工人'
                : user.role === 'SALES'
                  ? '销售'
                  : user.role === 'ADMIN'
                    ? '老板'
                    : user.role === 'PURCHASER'
                      ? '采购'
                      : '客户'}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <Button variant="destructive" className="h-12 w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        退出登录
      </Button>
    </div>
  );
}
