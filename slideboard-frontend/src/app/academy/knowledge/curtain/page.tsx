import React from 'react';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function CurtainKnowledgePage() {
  return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-ink-800">窗帘知识</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>基础概念</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <p className="text-ink-700">面料、辅料、轨道与配件的选型要点。</p>
          </PaperCardContent>
        </PaperCard>
      </div>
  );
}

