import { TableSkeleton } from "@/shared/ui/skeleton-variants";
import { DashboardPageHeader } from "@/shared/ui/dashboard-page-header";

/**
 * 角色设置页面的加载状态
 */
export default function RolesLoading() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="角色权限"
                subtitle="管理自定义角色及权限配置"
            />

            <div className="space-y-4">
                <div className="h-10 w-[200px] bg-muted animate-pulse rounded-md" />
                <TableSkeleton rows={5} />
            </div>
        </div>
    );
}
