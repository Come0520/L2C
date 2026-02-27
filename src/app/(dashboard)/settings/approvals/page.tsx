import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { BusinessRulesConfig } from '@/features/settings/components/business-rules-config';
import { getMyQuoteConfig } from '@/features/quotes/actions/config-actions';
import { getApprovalFlows } from '@/features/approval/actions/queries';
import {
  ApprovalSettingsContent,
  ApprovalFlow,
} from '@/features/approval/components/approval-settings-content';

export default async function ApprovalsSettingsPage() {
  const config = await getMyQuoteConfig();
  const flowsParams = await getApprovalFlows();
  let flows = [];
  if (flowsParams.success && flowsParams.data) {
    if (Array.isArray(flowsParams.data)) {
      flows = flowsParams.data;
    } else if (Array.isArray((flowsParams.data as any).data)) {
      flows = (flowsParams.data as any).data;
    }
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">审批设置</h1>
      </div>
      <div className="flex-1 p-6">
        <Tabs defaultValue="rules" className="w-full">
          <TabsList>
            <TabsTrigger value="flows">审批流程</TabsTrigger>
            <TabsTrigger value="rules">业务规则</TabsTrigger>
          </TabsList>
          <TabsContent value="flows" className="mt-6 space-y-4">
            <ApprovalSettingsContent initialFlows={flows as unknown as ApprovalFlow[]} />
          </TabsContent>
          <TabsContent value="rules" className="mt-6 space-y-4">
            <BusinessRulesConfig
              initialValues={{
                minDiscountRate: config.discountControl?.minDiscountRate,
                requireApprovalBelow: config.discountControl?.requireApprovalBelow,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
