'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * 角色管理页面 - 错误边界
 * Admin 模块 UI 加固的一部分，捕获角色管理操作异常
 */
export default function RolesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin/Roles] 页面异常:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 p-6 text-center">
      <div className="relative">
        <div className="absolute -inset-4 animate-pulse rounded-full bg-orange-500/20 blur-xl" />
        <AlertCircle className="relative h-16 w-16 text-orange-500" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-white">角色管理加载失败</h2>
        <p className="text-sm text-white/60">
          在加载角色权限配置时遇到了错误。请稍后重试或联系系统管理员。
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-white/30">错误代码: {error.digest}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={() => reset()}
          size="sm"
          className="glass-liquid gap-2 border-white/10 bg-white/10 text-white hover:bg-white/20"
        >
          <RefreshCcw className="h-4 w-4" />
          重试
        </Button>
        <Button asChild variant="ghost" size="sm" className="text-white/60 hover:text-white">
          <Link href="/settings" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回设置
          </Link>
        </Button>
      </div>
    </div>
  );
}
