'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">认证服务异常</h3>
                    <p className="text-sm text-muted-foreground">
                        无法完成您的认证请求。请稍后重试或联系管理员。
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button onClick={() => reset()} variant="default">
                        重试
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/login">返回登录页</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
