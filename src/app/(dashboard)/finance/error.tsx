'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { RefreshCcw, ArrowLeft } from 'lucide-react';
import { logger } from '@/shared/lib/logger';

/**
 * 财务模块错误边界
 * 捕获财务相关页面的运行时错误，提供友好的错误展示和恢复选项
 */
export default function FinanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('[finance] 页面渲染错误:', error);
  }, [error]);

  return (
    <div className="bg-background animate-in fade-in zoom-in flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-4 rounded-lg p-8 text-center duration-300">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight">财务模块加载异常</h3>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          抱歉，财务数据处理时遇到意外错误。这可能是由于数据格式变更或网络波动导致。
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="mx-auto mt-2 max-w-lg overflow-auto rounded border border-red-100 bg-red-50 p-2 font-mono text-xs text-red-500">
            {error.message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => reset()} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          重新加载
        </Button>
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回上页
        </Button>
      </div>
    </div>
  );
}
