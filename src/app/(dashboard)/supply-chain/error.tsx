'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ArrowLeft } from 'lucide-react';
import { logger } from '@/shared/lib/logger';

/**
 * 供应链模块错误边界
 * 捕获供应链相关页面的运行时错误，提供友好的错误展示和恢复选项
 */
export default function SupplyChainError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error('[supply-chain] 页面渲染错误:', error);
    }, [error]);

    return (
        <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-4 rounded-lg bg-background p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">供应链模块加载异常</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    抱歉，供应链数据处理时遇到意外错误。这可能是由于数据格式变更或网络波动导致。
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs font-mono text-red-500 bg-red-50 p-2 rounded mt-2 max-w-lg overflow-auto mx-auto border border-red-100">
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
