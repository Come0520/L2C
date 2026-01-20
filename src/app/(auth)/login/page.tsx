'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/shared/ui/card';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Phone from 'lucide-react/dist/esm/icons/phone';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                username: formData.phone,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('登录失败', {
                    description: '用户名或密码错误',
                });
            } else {
                toast.success('登录成功');
                router.push('/workbench');
                router.refresh();
            }
        } catch (error) {
            toast.error('登录出错', {
                description: '请稍后重试',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 liquid-mesh-bg -z-20" />
            <div className="fixed inset-0 aurora-animate -z-10" />

            <Card className="w-full max-w-md border-white/20 bg-white/60 shadow-xl backdrop-blur-xl dark:bg-black/60">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">L2C 销售管理系统</h1>
                    <p className="text-sm text-muted-foreground">
                        请输入您的账号密码登录
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9 bg-white/50 border-white/20 focus:bg-white"
                                    placeholder="手机号"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9 bg-white/50 border-white/20 focus:bg-white"
                                    placeholder="密码"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading}>
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
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-xs text-muted-foreground">
                        2026 Antigravity L2C System
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
