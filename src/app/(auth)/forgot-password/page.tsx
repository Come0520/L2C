'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Mail from 'lucide-react/dist/esm/icons/mail';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/logger';
import { requestPasswordReset, requestResetSchema } from '@/features/auth/actions/password-reset';

/**
 * 底部渐变动效 (Aceternity UI 特效)
 */
const BottomGradient = () => {
    return (
        <>
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
        </>
    );
};

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [hasError, setHasError] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validation = requestResetSchema.safeParse({ email });
        if (!validation.success) {
            toast.error(validation.error.issues[0]?.message || '请输入有效的邮箱地址');
            setHasError(true);
            setTimeout(() => setHasError(false), 500);
            return;
        }

        setIsLoading(true);

        try {
            const result = await requestPasswordReset({ email });

            if (!result.success) {
                setHasError(true);
                setTimeout(() => setHasError(false), 500);
                toast.error(result.error || '发送失败，请稍后重试');
            } else {
                toast.success('密码重置邮件已发送，请查收');
                setIsSuccess(true);
            }
        } catch (_err: unknown) {
            logger.error('[Auth:ForgotPassword] 表单提交异常:', _err);
            toast.error('网络连接异常，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="shadow-input mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl dark:bg-black/40 transition-all duration-300">
                <h2 className="text-center text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                    邮件已发送
                </h2>
                <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    我们已向 <span className="font-semibold text-neutral-800 dark:text-neutral-200">{email}</span> 发送了一封包含密码重置链接的邮件。<br /><br />
                    请检查您的收件箱（包括垃圾邮件文件夹）。
                </p>
                <div className="mt-8 flex justify-center">
                    <Link
                        href="/login"
                        className="flex items-center text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回登录
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "shadow-input mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl dark:bg-black/40 transition-all duration-300",
            hasError && "animate-shake ring-2 ring-red-500/50"
        )}>
            <div className="mb-6">
                <Link href="/login" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    返回
                </Link>
            </div>

            <h2 className="text-center text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                忘记密码
            </h2>
            <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
                请输入您的注册邮箱，我们将向您发送重置链接
            </p>

            <form className="mt-8" onSubmit={handleSubmit}>
                <div className="flex w-full flex-col space-y-2 mb-6">
                    <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">
                        电子邮箱
                    </Label>
                    <div className="relative">
                        <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="请输入您账号关联的邮箱"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input pl-10"
                            required
                            aria-required="true"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !email}
                    aria-busy={isLoading}
                    className="group/btn from-primary-600 to-primary-700 shadow-primary-500/30 hover:from-primary-500 hover:to-primary-600 relative block h-11 w-full rounded-xl bg-linear-to-br font-medium text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="flex items-center justify-center">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                        {isLoading ? '发送中...' : '发送重置邮件'}
                    </span>
                    <BottomGradient />
                </button>
            </form>
        </div>
    );
}
