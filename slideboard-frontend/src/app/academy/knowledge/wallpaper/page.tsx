import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function WallpaperKnowledgePage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-ink-800">墙布知识</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>材料与工艺</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <p className="text-ink-700">基材、胶水与施工工艺的质量要点。</p>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}

