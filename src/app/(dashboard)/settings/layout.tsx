import { SettingsSidebar } from '@/features/settings/components/settings-sidebar';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* 设置中心侧边栏导�?*/}
            <SettingsSidebar />

            {/* 主内容区�?*/}
            <main className="flex-1 overflow-y-auto">
                <div className="container max-w-5xl py-8 px-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
