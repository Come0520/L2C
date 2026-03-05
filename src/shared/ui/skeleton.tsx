import { cn } from '@/shared/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/20 backdrop-blur-sm dark:bg-white/10',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
