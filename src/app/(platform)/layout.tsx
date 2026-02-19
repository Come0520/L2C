import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { Sidebar } from '@/widgets/layout/sidebar';
import { Header } from '@/widgets/layout/header';

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
        redirect('/');
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-transparent">
            {/* 侧边栏导航 */}
            <Sidebar />

            {/* 主内容区域 */}
            <div className="flex flex-col flex-1 overflow-hidden relative">
                <Header session={session} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative md:ml-[60px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
