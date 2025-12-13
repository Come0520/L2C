import React from 'react';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function WallPanelsKnowledgePage() {
  return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-ink-800">墙咔知识</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>结构与安装</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <p className="text-ink-700">墙面装饰板的结构、固定与收边处理。</p>
          </PaperCardContent>
        </PaperCard>
      </div>
  );
}

