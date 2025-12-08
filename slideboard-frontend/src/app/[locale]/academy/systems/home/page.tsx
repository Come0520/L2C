import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function HomeSystemPage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-ink-800">HOME 系统学习</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>模块简介</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <p className="text-ink-700">门店经营、会员、营销活动的系统能力介绍。</p>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}

