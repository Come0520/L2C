'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

/**
 * 认证错误页面组件 (客户端路由异常接管)
 * 
 * @description
 * 当 NextAuth 或认证相关的 API 路由抛出异常时，Next.js 会自动渲染此页面。
 * 提供友好的错误提示、技术支持链接，并允许用户通过 `reset` 重新尝试或返回登录。
 * 
 * @param {Error & { digest?: string }} error - 包含错误原始信息及唯一摘要 ID 的对象
 * @param {() => void} reset - Next.js 提供的重置函数，尝试重新渲染该路由段
 */
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
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">认证服务遇到了一些问题</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        很抱歉，我们暂时无法验证您的身份或完成当前的请求。这可能是由于网络波动或登录会话已过期。
                    </p>
                    <div className="rounded-md bg-secondary/50 p-3 text-sm text-secondary-foreground text-left">
                        <p className="font-medium mb-1">建议的解决步骤：</p>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            <li>检查您的网络连接并重试</li>
                            <li>返回登录页重新输入凭证</li>
                            <li>若问题持续存在，请联系 <a href="mailto:support@l2c.com" className="font-medium text-primary hover:underline">support@l2c.com</a></li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
                    <Button onClick={() => reset()} variant="default" className="min-w-[120px]">
                        再试一次
                    </Button>
                    <Button variant="outline" asChild className="min-w-[120px]">
                        <Link href="/login">重新登录</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
