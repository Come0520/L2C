import { SettingsTabNav } from '@/features/settings/components/settings-tab-nav';

/**
 * 系统设置模块布局
 * 采用顶部Tabs导航 + 内容区域的布局模式
 */
export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            {/* 顶部Tab导航 */}
            <div className="shrink-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
                <SettingsTabNav />
            </div>
            {/* 内容区域 */}
            <main className="flex-1 overflow-y-auto">
                <div className="container max-w-5xl py-8 px-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
