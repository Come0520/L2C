export default function ApprovalsSkeleton() {
    return (
        <div className="p-4 space-y-4 max-w-lg mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center rounded-md animate-pulse">
                    <div className="h-4 w-4 bg-gray-300 dark:bg-zinc-700 rounded-sm mr-2" />
                    <div className="h-4 w-10 bg-gray-300 dark:bg-zinc-700 rounded-sm" />
                </div>
            </div>

            {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm animate-pulse mb-3">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-2">
                            <div className="h-5 w-48 bg-gray-200 dark:bg-zinc-800 rounded" />
                            <div className="h-4 w-32 bg-gray-100 dark:bg-zinc-800 rounded" />
                        </div>
                        <div className="h-6 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full" />
                    </div>

                    <div className="pt-3 flex justify-between items-center text-sm border-t border-gray-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                            <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded" />
                        </div>
                        <div className="h-4 w-24 bg-gray-100 dark:bg-zinc-800 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
