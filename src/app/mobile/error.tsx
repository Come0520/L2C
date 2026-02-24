'use client';

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function MobileError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // 在此处可将错误上报到监控平台或 Sentry
        console.error("Mobile Route Error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                哎呀，页面跑丢了
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[280px]">
                {error.message || "由于网络波动或服务器异常，我们暂时无法加载此页面。请稍后再试。"}
            </p>

            <Button
                onClick={() => reset()}
                className="w-full max-w-[200px] h-11 flex items-center justify-center gap-2 rounded-full"
                variant="default"
            >
                <RefreshCcw className="w-4 h-4" />
                重新加载
            </Button>
        </div>
    );
}
