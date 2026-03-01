export default function ApprovalsSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-lg space-y-4 bg-gray-50 p-4 dark:bg-zinc-950">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
        <div className="flex h-8 w-20 animate-pulse items-center justify-center rounded-md bg-gray-200 dark:bg-zinc-800">
          <div className="mr-2 h-4 w-4 rounded-sm bg-gray-300 dark:bg-zinc-700" />
          <div className="h-4 w-10 rounded-sm bg-gray-300 dark:bg-zinc-700" />
        </div>
      </div>

      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="mb-3 animate-pulse rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="h-5 w-48 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="h-4 w-32 rounded bg-gray-100 dark:bg-zinc-800" />
            </div>
            <div className="h-6 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30" />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-zinc-800" />
              <div className="h-4 w-16 rounded bg-gray-200 dark:bg-zinc-800" />
            </div>
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
