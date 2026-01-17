import { SettingsSidebar } from '@/features/settings/components/settings-sidebar';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            <SettingsSidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="container max-w-5xl py-8 px-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
