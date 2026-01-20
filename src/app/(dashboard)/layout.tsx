import { AppSidebar } from '../../widgets/layout/sidebar';
import { Header } from '../../widgets/layout/header';

/**
 * Dashboard 布局组件
 * 使用 Aceternity Sidebar 实现自适应侧边栏
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* 侧边栏导航 */}
            <AppSidebar />

            {/* 主内容区域 */}
            <div className="flex flex-col flex-1 overflow-hidden relative">
                <Header />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative md:ml-[60px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
