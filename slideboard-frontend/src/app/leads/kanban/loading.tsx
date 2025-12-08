import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';

// 线索项骨架屏
function LeadItemSkeleton() {
  return (
    <PaperCard className="mb-3">
      <PaperCardContent className="p-3 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          <Skeleton className="h-4 w-12" variant="circle" />
          <Skeleton className="h-4 w-12" variant="circle" />
        </div>
      </PaperCardContent>
    </PaperCard>
  );
}

// 看板列骨架屏
function ColumnSkeleton() {
  return (
    <div className="w-80 flex flex-col bg-paper-100 rounded-lg border border-paper-300">
      <div className="p-3 font-medium text-ink-700 border-b border-paper-200 flex justify-between items-center bg-white rounded-t-lg">
        <Skeleton className="h-5 w-1/3" />
        <PaperBadge variant="default" className="bg-paper-200">
          <Skeleton className="h-3 w-6" />
        </PaperBadge>
      </div>
      <div className="flex-1 p-2 overflow-y-auto space-y-2">
        {[...Array(3)].map((_, index) => (
          <LeadItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full p-4 space-x-4 min-w-max">
          {/* 渲染8个列骨架屏，模拟真实布局 */}
          {[...Array(8)].map((_, index) => (
            <ColumnSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}