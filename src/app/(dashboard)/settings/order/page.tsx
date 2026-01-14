import { auth } from '@/shared/lib/auth';
import { WorkflowConfigForm } from '@/features/settings/workflow/workflow-config-form';
import { getWorkflowConfig } from '@/features/settings/workflow/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { GitBranch, FileCheck } from 'lucide-react';

export default async function OrderConfigPage() {
    const session = await auth();
    if (!session?.user) return null;

    const workflowConfig = await getWorkflowConfig(session.user.tenantId);

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">订单配置</h1>
                <p className="text-muted-foreground">
                    配置订单创建流程和生产触发条�?
                </p>
            </div>

            <Tabs defaultValue="workflow" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="workflow" className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        工作流程
                    </TabsTrigger>
                    <TabsTrigger value="production" className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        生产配置
                    </TabsTrigger>
                </TabsList>

                {/* 工作流程配置 */}
                <TabsContent value="workflow" className="mt-6">
                    <WorkflowConfigForm initialData={workflowConfig} />
                </TabsContent>

                {/* 生产配置 */}
                <TabsContent value="production" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>生产触发条件</CardTitle>
                            <CardDescription>
                                配置订单何时可以进入生产状�?
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                生产触发条件配置正在开发中...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
