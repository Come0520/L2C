import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

export function AnalyticsCardSkeleton() {
  return (
    <Card className="col-span-full min-h-[350px] lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-[140px]" />
        <Skeleton className="h-5 w-[80px] rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mt-4 h-[250px] w-full" />
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-[80px]" />
            <Skeleton className="h-6 w-[60px]" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-[80px]" />
            <Skeleton className="h-6 w-[60px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
