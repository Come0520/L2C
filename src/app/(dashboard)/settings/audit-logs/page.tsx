import { AuditLogPanel } from '@/features/settings/components/audit-log-panel';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

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
