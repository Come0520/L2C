import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function L2CSystemPage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-ink-800">L2C 系统学习</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>流程总览</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <p className="text-ink-700">从线索到成交的端到端业务流程与最佳实践。</p>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}

