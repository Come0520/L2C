'use client';

/**
 * 移动端登录页面
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMobileAuth } from '@/shared/auth/mobile-auth-context';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Loader2 } from 'lucide-react';

export default function MobileLoginPage() {
    const router = useRouter();
    const { login } = useMobileAuth();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!phone || !password) {
            setError('请输入手机号和密码');
            return;
        }

        setIsLoading(true);
        const result = await login(phone, password);
        setIsLoading(false);

        if (result.success) {
            router.push('/mobile/tasks');
        } else {
            setError(result.message || '登录失败');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
            <div className="w-full max-w-sm">
                {/* Logo / 标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">L2C 移动端</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">工人端登录</p>
                </div>

                {/* 登录表单 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">手机号</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="请输入手机号"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-12 text-base"
                            maxLength={11}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">密码</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 text-base"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 text-base"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                登录中...
                            </>
                        ) : (
                            '登录'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
