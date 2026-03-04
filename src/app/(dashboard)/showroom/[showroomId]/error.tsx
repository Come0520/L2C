'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { AlertCircle, RefreshCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * 展厅素材详情页 - 错误边界
 * 捕获异步数据加载或渲染异常，避免整页白屏
 */
export default function ShowroomDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ShowroomDetail] 页面异常:', error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-6 p-6 text-center">
      <div className="relative">
        <div className="absolute -inset-4 animate-pulse rounded-full bg-red-500/20 blur-xl" />
        <AlertCircle className="relative h-20 w-20 text-red-500" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-white">素材详情加载失败</h2>
        <p className="text-white/60">
          在获取展厅素材详情时遇到了意外错误。这可能是由于素材不存在、网络问题或系统暂时中断引起的。
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
          <Link href="/showroom" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回展厅
          </Link>
        </Button>
      </div>
    </div>
  );
}
