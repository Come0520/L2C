import { Skeleton } from "@/shared/ui/skeleton"

/**
 * 供应链模块加载骨架屏
 * 在数据加载期间显示，提升用户体验
 */
export default function SupplyChainLoading() {
    return (
        <div className="space-y-6">
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

            {/* 工具栏区 */}
            <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                    <Skeleton className="h-9 w-[200px]" />
                    <Skeleton className="h-9 w-[120px]" />
                    <Skeleton className="h-9 w-[120px]" />
                </div>
                <Skeleton className="h-9 w-[100px]" />
            </div>

            {/* 表格区域 */}
            <div className="rounded-md border">
                <div className="border-b p-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-[60px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[60px]" />
                    </div>
                </div>
                <div className="space-y-4 p-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
