'use client';

import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <PaperCard key={index} hover>
          <PaperCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="p-3 bg-paper-300 rounded-full animate-pulse">
                <div className="w-6 h-6"></div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      ))}
    </div>
  );
}