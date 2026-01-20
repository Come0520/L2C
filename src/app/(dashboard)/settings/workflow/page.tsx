import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { getTenantBusinessConfig } from '@/features/settings/actions/tenant-config';
import { WorkflowConfigForm } from './workflow-config-form';

/**
 * 业务流程模式配置页面
 * 根据租户规模配置不同的业务流程模式
 */
export default async function WorkflowSettingsPage() {
    const config = await getTenantBusinessConfig();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="业务流程模式"
                subtitle="根据团队规模配置业务流程"
            />

            <WorkflowConfigForm initialConfig={config.workflowMode} />
        </div>
    );
}
