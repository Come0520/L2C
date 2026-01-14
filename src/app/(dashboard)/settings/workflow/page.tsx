import { OrbBackground } from '@/shared/ui/liquid/orb-background';
import { WorkflowList } from '@/features/approval/components/workflow-list';
import { getApprovalFlows } from '@/features/settings/actions';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';

export default async function WorkflowSettingsPage() {
    const session = await auth();
    if (!session) redirect('/login');

    const result = await getApprovalFlows();
    const flows = result.success ? result.data : [];

    return (
        <div className="relative min-h-screen w-full text-white">
            <OrbBackground />

            <div className="relative z-10 container mx-auto py-10">
                <div className="flex justify-between items-center mb-8 px-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            审批流程配置
                        </h1>
                        <p className="text-white/50 mt-2">
                            管理业务模块的审批规则与自动化流�?
                        </p>
                    </div>
                </div>

                <WorkflowList flows={flows} />
            </div>
        </div>
    );
}
