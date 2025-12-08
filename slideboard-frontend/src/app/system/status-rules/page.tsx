'use client';
import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

export default function StatusRulesPage() {
  const flows = [
    { entity: '订单', rules: '草稿 → 审核中 → 已审核 → 发货中 → 已完成' },
    { entity: '线索', rules: '新建 → 跟进中 → 已转化/关闭' },
  ];
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-ink-800">状态流转规则</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>业务流程</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>对象</PaperTableCell>
                <PaperTableCell>规则</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {flows.map(f => (
                  <PaperTableRow key={f.entity}>
                    <PaperTableCell>{f.entity}</PaperTableCell>
                    <PaperTableCell>{f.rules}</PaperTableCell>
                  </PaperTableRow>
                ))}
              </PaperTableBody>
            </PaperTable>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}

