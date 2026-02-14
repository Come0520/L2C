'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileWarning } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <html>
            <body className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
                <div className="flex max-w-md flex-col items-center text-center space-y-4 rounded-lg bg-white p-8 shadow-lg border border-gray-100">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                        <FileWarning className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">系统遇到了一些问题</h2>
                    <p className="text-gray-500 text-sm">
                        这可能是个临时故障。若问题持续存在，请联系技术支持。<br />
                        错误代码: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs text-gray-700">{error.digest || 'UNKNOWN'}</code>
                    </p>
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={() => reset()}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            重试
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                        >
                            返回首页
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    );
}
