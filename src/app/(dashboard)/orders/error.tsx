'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';

export default function Error({
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
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <h2 className="text-lg font-semibold">出错了 (Something when wrong)</h2>
            <Button onClick={() => reset()}>重试 (Try again)</Button>
        </div>
    );
}
