import { Sidebar } from '../../widgets/layout/sidebar';
import { Header } from '../../widgets/layout/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden relative">
                <Header />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
