import { Skeleton } from "@/shared/ui/skeleton"

/**
 * 财务模块加载骨架屏
 * 在数据加载期间显示，提升用户体验
 */
export default function FinanceLoading() {
    return (
        <div className="space-y-6">
            {/* 页面标题区 */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-7 w-[120px]" />
                    <Skeleton className="h-4 w-[200px] mt-2" />
                </div>
                <Skeleton className="h-9 w-[100px]" />
            </div>

            {/* 统计卡片区 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-4 space-y-3">
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-7 w-[120px]" />
                        <Skeleton className="h-3 w-[100px]" />
                    </div>
                ))}
            </div>

            {/* 筛选栏 */}
            <div className="flex space-x-2 border-b pb-1">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
            </div>

            {/* 表格区域 */}
            <div className="rounded-md border">
                <div className="border-b p-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[60px]" />
                    </div>
                </div>
                <div className="space-y-4 p-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
