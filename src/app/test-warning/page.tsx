import React from 'react';
import { ApprovalFlowDesigner } from '@/features/approval/components/approval-flow-designer';

export default function TestWarningPage() {
  return (
    <div className="h-screen w-full p-8">
      <ApprovalFlowDesigner flowId="test-id" />
    </div>
  );
}
