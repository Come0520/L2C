export default function TasksSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-lg space-y-4 bg-gray-50 p-4 dark:bg-zinc-950">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
      </div>

      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex w-2/3 flex-col gap-2">
              <div className="h-5 w-full rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-zinc-800" />
            </div>
            <div className="h-6 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30" />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-zinc-800" />
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-zinc-800" />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-zinc-800">
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-zinc-800" />
            <div className="h-9 w-24 rounded-md bg-blue-100 dark:bg-blue-900/20" />
          </div>
        </div>
      ))}
    </div>
  );
}
