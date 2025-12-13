'use client';

import { FileBarChart } from 'lucide-react';
import React from 'react';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperSelect } from '@/components/ui/paper-input';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

export default function FinanceReportsPage() {
  const [period, setPeriod] = React.useState('month');

  const rows = [
    { name: '销售收入', value: 123456 },
    { name: '成本支出', value: 85432 },
    { name: '毛利', value: 38024 },
  ];

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">财务报表</h1>
            <p className="text-ink-500 mt-1">期间维度汇总与分析</p>
          </div>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <div className="flex items-center justify-between w-full">
              <PaperCardTitle>期间选择</PaperCardTitle>
              <div className="w-48">
                <PaperSelect value={period} onChange={(e) => setPeriod(e.target.value)} options={[
                  { value: 'day', label: '按日' },
                  { value: 'week', label: '按周' },
                  { value: 'month', label: '按月' },
                  { value: 'quarter', label: '按季' },
                  { value: 'year', label: '按年' },
                ]} />
              </div>
            </div>
          </PaperCardHeader>
          <PaperCardContent>
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>科目</PaperTableCell>
                <PaperTableCell>金额</PaperTableCell>
                <PaperTableCell>趋势</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {rows.map(r => (
                  <PaperTableRow key={r.name}>
                    <PaperTableCell>{r.name}</PaperTableCell>
                    <PaperTableCell>¥{r.value.toLocaleString()}</PaperTableCell>
                    <PaperTableCell>
                      <FileBarChart className="h-4 w-4" />
                    </PaperTableCell>
                  </PaperTableRow>
                ))}
              </PaperTableBody>
            </PaperTable>
          </PaperCardContent>
        </PaperCard>
      </div>
  );
}

