export default function MobileLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="relative h-12 w-12">
        <div className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-gray-200 dark:border-zinc-800" />
        <div className="absolute top-0 left-0 h-full w-full animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-500 dark:border-t-transparent" />
      </div>

      <p className="mt-4 animate-pulse text-sm text-gray-500 dark:text-gray-400">数据加载中...</p>
    </div>
  );
}
