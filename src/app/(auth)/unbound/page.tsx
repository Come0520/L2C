/**
 * 未绑定租户提示页面
 * 
 * 当用户通过微信直接登录但未通过邀请链接绑定时显示
 */
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, QrCode, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default async function UnboundPage() {
    const session = await auth();

    // 如果已绑定租户，重定向到首页
    if (session?.user?.tenantId) {
        redirect('/');
    }

    // 如果未登录，重定向到登录页
    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                    </div>
                    <CardTitle className="text-xl text-white">
                        账户未绑定
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                        您的账户尚未绑定到任何租户，请通过以下方式注册：
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* 员工入口 */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-start gap-3">
                            <QrCode className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-white">我是员工</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    请联系您的管理员获取员工邀请二维码，扫码后即可加入团队
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 客户入口 */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-start gap-3">
                            <UserPlus className="w-5 h-5 text-green-400 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-white">我是客户</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    您的销售顾问会从客户详情页向您发送邀请链接
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="pt-4 space-y-3">
                        <Button
                            variant="outline"
                            className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                            asChild
                        >
                            <Link href="/login">
                                返回登录
                            </Link>
                        </Button>
                    </div>

                    {/* 当前用户信息 */}
                    <div className="pt-4 text-center text-sm text-slate-500">
                        当前登录：{session.user.name || '微信用户'}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
