'use client';

import { Skeleton } from "@/shared/ui/skeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-10 w-[100px]" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3 p-4 border rounded-lg">
                    <Skeleton className="h-[125px] w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[300px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
            <Skeleton className="h-[400px] w-full" />
        </div>
    );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MobileTaskSkeleton() {
    return (
        <div className="space-y-4 px-4 py-4">
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 mb-4 h-9">
                <Skeleton className="flex-1 h-7" />
                <Skeleton className="flex-1 h-7" />
                <Skeleton className="flex-1 h-7" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 mb-3">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-12" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-5 w-5" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MobileApprovalSkeleton() {
    return (
        <div className="space-y-4 px-4 py-4">
            <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-6 w-full mb-2" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MobileDetailSkeleton() {
    return (
        <div className="space-y-6 px-4 py-4 mt-14">
            <Skeleton className="h-6 w-16 mb-4" /> {/* Back button */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-7 w-3/4 mb-3" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
            <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
            </div>
        </div>
    );
}
