'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-4 rounded-lg bg-background p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">加载页面时遇到问题</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    抱歉，我们在处理您的请求时遇到了意外错误。这可能只是暂时的网络波动。
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
                <Button variant="outline" onClick={() => window.location.reload()}>
                    强制刷新
                </Button>
            </div>
        </div>
    );
}
