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
        <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="relative">
                <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                <AlertCircle className="h-20 w-20 text-red-500 relative" />
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-white">展厅加载失败</h2>
                <p className="text-white/60">
                    抱歉，在获取展厅内容时遇到了意外错误。这可能是由于网络问题或系统暂时中断引起的。
                </p>
                {error.digest && (
                    <p className="text-xs text-white/30 font-mono">错误代码: {error.digest}</p>
                )}
            </div>

            <div className="flex items-center gap-4">
                <Button
                    onClick={() => reset()}
                    className="gap-2 glass-liquid bg-white/10 hover:bg-white/20 text-white border-white/10"
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
