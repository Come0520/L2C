import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function FunctionalCurtainKnowledgePage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-ink-800">功能帘知识</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>应用与选型</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <p className="text-ink-700">遮阳帘、百叶帘等功能帘的适用场景与参数。</p>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}

