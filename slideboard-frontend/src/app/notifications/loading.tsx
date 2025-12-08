import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationsLoadingProps {
  type?: 'notifications' | 'approvals';
}

// 通知项骨架屏
function NotificationSkeleton() {
  return (
    <PaperCard className="mb-3">
      <PaperCardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-20" variant="circle" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between text-sm">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </PaperCardContent>
    </PaperCard>
  );
}

// 审批项骨架屏
function ApprovalSkeleton() {
  return (
    <PaperCard className="mb-3">
      <PaperCardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-1/3" />
          <PaperBadge variant="default" className="bg-paper-200">
            <Skeleton className="h-3 w-8" />
          </PaperBadge>
        </div>
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between text-sm">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-4 w-20" variant="circle" />
          <Skeleton className="h-4 w-20" variant="circle" />
        </div>
      </PaperCardContent>
    </PaperCard>
  );
}

export default function NotificationsLoading({ type = 'notifications' }: NotificationsLoadingProps) {
  const count = type === 'notifications' ? 5 : 3;
  const SkeletonComponent = type === 'notifications' ? NotificationSkeleton : ApprovalSkeleton;

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  );
}