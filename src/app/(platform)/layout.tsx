/**
 * 平台管理员布局
 * 
 * 验证用户是否为平台管理员，未授权则重定向
 */
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

export default async function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // 未登录，重定向到登录页
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/admin/tenants');
    }

    // 验证是否为平台管理员
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { isPlatformAdmin: true },
    });

    if (!user?.isPlatformAdmin) {
        // 非管理员，重定向到首页
        redirect('/workbench');
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">L2C</span>
                        </div>
                        <h1 className="text-white font-semibold">平台管理后台</h1>
                    </div>
                    <div className="text-slate-400 text-sm">
                        {session.user.name || session.user.email}
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}
