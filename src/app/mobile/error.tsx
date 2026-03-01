'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';

export default function MobileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 在此处可将错误上报到监控平台或 Sentry
    console.error('Mobile Route Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        哎呀，页面跑丢了
      </h2>

      <p className="mb-8 max-w-[280px] text-sm text-gray-500 dark:text-gray-400">
        {error.message || '由于网络波动或服务器异常，我们暂时无法加载此页面。请稍后再试。'}
      </p>

      <Button
        onClick={() => reset()}
        className="flex h-11 w-full max-w-[200px] items-center justify-center gap-2 rounded-full"
        variant="default"
      >
        <RefreshCcw className="h-4 w-4" />
        重新加载
      </Button>
    </div>
  );
}
