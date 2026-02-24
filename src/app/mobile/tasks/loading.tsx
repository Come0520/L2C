export default function TasksSkeleton() {
    return (
        <div className="p-4 space-y-4 max-w-lg mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>

            {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-2 w-2/3">
                            <div className="h-5 w-full bg-gray-200 dark:bg-zinc-800 rounded" />
                            <div className="h-4 w-3/4 bg-gray-100 dark:bg-zinc-800 rounded" />
                        </div>
                        <div className="h-6 w-16 bg-orange-100 dark:bg-orange-900/30 rounded-full" />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                        <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-3">
                        <div className="h-4 w-24 bg-gray-100 dark:bg-zinc-800 rounded" />
                        <div className="h-9 w-24 bg-blue-100 dark:bg-blue-900/20 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}
