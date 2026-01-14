import React from 'react';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { getWorkflowConfig } from '@/features/settings/workflow/actions';
import { WorkflowConfigForm } from '@/features/settings/workflow/workflow-config-form';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

export default async function WorkflowSettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const config = await getWorkflowConfig(session.user.tenantId);

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="业务流程配置"
                subtitle="自定义线索、测量、报价到订单的流转逻辑"
            />

            <div className="max-w-4xl">
                <WorkflowConfigForm initialData={config} />
            </div>
        </div>
    );
}
