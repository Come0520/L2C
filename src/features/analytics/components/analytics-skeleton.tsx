import { Card, CardHeader, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function AnalyticsCardSkeleton() {
    return (
        <Card className="col-span-full lg:col-span-3 min-h-[350px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-5 w-[80px] rounded-full" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[250px] w-full mt-4" />
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-[80px]" />
                        <Skeleton className="h-6 w-[60px]" />
                    </div>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-[80px]" />
                        <Skeleton className="h-6 w-[60px]" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
