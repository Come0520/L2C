'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 可以在这里记录错误到监控系统
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-6 p-6 text-center">
      <div className="relative">
        <div className="absolute -inset-4 animate-pulse rounded-full bg-red-500/20 blur-xl" />
        <AlertCircle className="relative h-20 w-20 text-red-500" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-white">展厅加载失败</h2>
        <p className="text-white/60">
          抱歉，在获取展厅内容时遇到了意外错误。这可能是由于网络问题或系统暂时中断引起的。
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-white/30">错误代码: {error.digest}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={() => reset()}
          className="glass-liquid gap-2 border-white/10 bg-white/10 text-white hover:bg-white/20"
        >
          <RefreshCcw className="h-4 w-4" />
          重试
        </Button>
        <Button asChild variant="ghost" className="text-white/60 hover:text-white">
          <Link href="/" className="gap-2">
            <Home className="h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>
    </div>
  );
}
