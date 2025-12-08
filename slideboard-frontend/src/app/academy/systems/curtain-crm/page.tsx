import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function CurtainCrmSystemPage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-ink-800">帘客云系统学习</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>协同能力</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <p className="text-ink-700">从设计到安装的协同流程与角色分工。</p>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}

