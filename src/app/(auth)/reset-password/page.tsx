'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/logger';
import { resetPassword, resetPasswordSchema } from '@/features/auth/actions/password-reset';

const BottomGradient = () => {
    return (
        <>
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
        </>
    );
};

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('无效的充值链接：缺少令牌');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error('重置链接无效，缺失令牌');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('两次输入的密码不一致');
            setHasError(true);
            setTimeout(() => setHasError(false), 500);
            return;
        }

        const validation = resetPasswordSchema.safeParse({ token, newPassword: password });
        if (!validation.success) {
            toast.error(validation.error.issues[0]?.message || '验证失败');
            setHasError(true);
            setTimeout(() => setHasError(false), 500);
            return;
        }

        setIsLoading(true);

        try {
            const result = await resetPassword({ token, newPassword: password });

            if (!result.success) {
                setHasError(true);
                setTimeout(() => setHasError(false), 500);
                toast.error(result.error || '密码重置失败');
            } else {
                toast.success('密码重置成功，请使用新密码登录');
                setIsSuccess(true);
            }
        } catch (_err: unknown) {
            logger.error('[Auth:ResetPassword] 表单提交异常:', _err);
            toast.error('网络连接异常，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="shadow-input mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl dark:bg-black/40 transition-all duration-300">
                <h2 className="text-center text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                    重置成功
                </h2>
                <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    您的密码已成功更新。现在您可以使用新密码登录系统。
                </p>
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="group/btn from-primary-600 to-primary-700 shadow-primary-500/30 hover:from-primary-500 hover:to-primary-600 relative block h-11 w-full rounded-xl bg-linear-to-br font-medium text-white shadow-lg transition-all duration-200"
                    >
                        去登录
                        <BottomGradient />
                    </button>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="shadow-input mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl dark:bg-black/40 transition-all duration-300">
                <h2 className="text-center text-2xl font-bold text-red-600 dark:text-red-400">
                    链接无效
                </h2>
                <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    该重置链接无效或缺少参数，请重新发起重置请求。
                </p>
                <div className="mt-8 flex justify-center">
                    <Link
                        href="/forgot-password"
                        className="flex items-center text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        重新获取链接
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
            <h2 className="text-center text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                设置新密码
            </h2>
            <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
                请为您账号设置一个新的密码
            </p>

            <form className="mt-8" onSubmit={handleSubmit}>
                <div className="flex w-full flex-col space-y-2 mb-4">
                    <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">
                        新密码
                    </Label>
                    <div className="relative">
                        <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="至少 8 位字符"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input pr-10 pl-10"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex w-full flex-col space-y-2 mb-8">
                    <Label htmlFor="confirmPassword" className="text-neutral-700 dark:text-neutral-300">
                        确认新密码
                    </Label>
                    <div className="relative">
                        <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="再次输入新密码"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="glass-input pr-10 pl-10"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                    aria-busy={isLoading}
                    className="group/btn from-primary-600 to-primary-700 shadow-primary-500/30 hover:from-primary-500 hover:to-primary-600 relative block h-11 w-full rounded-xl bg-linear-to-br font-medium text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="flex items-center justify-center">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                        {isLoading ? '提交中...' : '确认重置'}
                    </span>
                    <BottomGradient />
                </button>
            </form>
        </div>
    );
}
