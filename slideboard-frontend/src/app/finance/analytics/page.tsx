'use client';

import { BarChart3 } from 'lucide-react';
import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function FinanceAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">数据分析</h1>
          <p className="text-ink-500 mt-1">销售、成本、利润的可视化分析</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>销售趋势</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="h-48 flex items-center justify-center bg-paper-300 rounded-lg">
                <BarChart3 className="h-10 w-10 text-ink-500" />
              </div>
            </PaperCardContent>
          </PaperCard>
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>利润结构</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="h-48 flex items-center justify-center bg-paper-300 rounded-lg">
                <BarChart3 className="h-10 w-10 text-ink-500" />
              </div>
            </PaperCardContent>
          </PaperCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

