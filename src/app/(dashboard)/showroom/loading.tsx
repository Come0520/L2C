import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="h-[calc(100vh-8rem)] p-6 space-y-4">
            {/* Header Skeleton */}
            <div className="flex w-full items-center justify-between">
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-20 rounded-full bg-white/5" />
                    ))}
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28 rounded-md bg-white/5" />
                    <Skeleton className="h-10 w-28 rounded-md bg-white/5" />
                </div>
            </div>

            {/* Content Card Skeleton */}
            <div className="w-full flex-1 rounded-2xl p-6 glass-liquid-ultra border border-white/10 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-10 w-full max-w-sm rounded-md bg-white/5" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-20 rounded-md bg-white/5" />
                        <Skeleton className="h-10 w-20 rounded-md bg-white/5" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/5">
                            <Skeleton className="h-40 w-full rounded-lg bg-white/5" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4 bg-white/5" />
                                <Skeleton className="h-4 w-1/2 bg-white/5" />
                            </div>
                            <div className="flex justify-between pt-2">
                                <Skeleton className="h-8 w-20 bg-white/5" />
                                <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
