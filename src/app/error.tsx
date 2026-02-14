'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ErrorBoundary({
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
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-red-50 p-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                应用遇到了一些问题
            </h2>
            <p className="mb-6 text-gray-600 max-w-sm">
                别担心，这是我们的问题，不是你的问题。你可以尝试刷新页面或点击下方按钮重试。
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()}>重试</Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    返回首页
                </Button>
            </div>
        </div>
    );
}
