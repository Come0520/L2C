export default function MobileLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative w-12 h-12">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 dark:border-zinc-800 rounded-full" />
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent dark:border-t-transparent animate-spin" />
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                数据加载中...
            </p>
        </div>
    );
}
