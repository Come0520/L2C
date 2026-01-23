'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 登录表单组件
 * 支持手机号/邮箱 + 密码登录
 */
export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('登录失败：用户名或密码错误');
            } else {
                toast.success('登录成功');
                router.push('/');
                router.refresh();
            }
        } catch (_error) {
            toast.error('登录失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
                <CardTitle className="text-white text-center">登录</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-slate-200">
                            手机号 / 邮箱
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="请输入手机号或邮箱"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-200">
                            密码
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        登录
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
