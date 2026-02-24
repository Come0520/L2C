import { TableSkeleton } from "@/shared/ui/skeleton-variants";
import { DashboardPageHeader } from "@/shared/ui/dashboard-page-header";

/**
 * 用户管理页面的加载状态
 */
export default function UsersLoading() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="用户管理"
                subtitle="管理系统用户和权限"
            />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="h-10 w-[200px] bg-muted animate-pulse rounded-md" />
                    <div className="h-10 w-[100px] bg-muted animate-pulse rounded-md" />
                </div>
                <TableSkeleton rows={8} />
            </div>
        </div>
    );
}
