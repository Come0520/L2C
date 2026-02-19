import dynamic from 'next/dynamic';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Skeleton } from '@/shared/ui/skeleton';

/** 懒加载：操作日志面板 */
const AuditLogPanel = dynamic(
    () => import('@/features/settings/components/audit-log-panel').then(m => m.AuditLogPanel),
    { loading: () => <Skeleton className="h-[400px] w-full rounded-lg" /> }
);

/**
 * 操作日志设置页面
 * [Settings-03] 操作日志查看
 */
export default function AuditLogsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="操作日志"
                subtitle="查看系统操作记录和数据变更历史"
            />
            <AuditLogPanel />
        </div>
    );
}
