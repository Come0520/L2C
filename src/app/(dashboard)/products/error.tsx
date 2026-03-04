'use client';

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-bold">模块出错了</h2>
      <p className="text-muted-foreground mt-2 text-sm">{error.message}</p>
      <button onClick={reset} className="bg-primary mt-4 rounded-lg px-4 py-2 text-white">
        重试
      </button>
    </div>
  );
}
