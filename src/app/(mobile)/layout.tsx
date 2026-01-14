
import "@/app/globals.css";

export default function MobileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-950">
            <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b z-50 flex items-center px-4 shadow-sm">
                <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Antigravity Measure</h1>
            </header>
            <main className="flex-1 pt-14 pb-20 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
