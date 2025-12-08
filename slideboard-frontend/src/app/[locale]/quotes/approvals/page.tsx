'use client';

import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

export default function ApprovalsPage() {
  const items = [
    { id: 'A202501', title: '订单折扣审批', applicant: '王丽', status: 'pending' },
    { id: 'A202502', title: '退款审批', applicant: '张伟', status: 'approved' },
    { id: 'A202503', title: '价格调整审批', applicant: '李敏', status: 'rejected' },
  ];

  const statusMap: Record<string, { text: string; variant: 'success' | 'warning' | 'error' }> = {
    pending: { text: '待审批', variant: 'warning' },
    approved: { text: '已通过', variant: 'success' },
    rejected: { text: '已拒绝', variant: 'error' },
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">审批流程</h1>
          <p className="text-ink-500 mt-1">通知与审批联动</p>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>审批列表</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>编号</PaperTableCell>
                <PaperTableCell>事项</PaperTableCell>
                <PaperTableCell>申请人</PaperTableCell>
                <PaperTableCell>状态</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {items.map(i => (
                  <PaperTableRow key={i.id}>
                    <PaperTableCell>{i.id}</PaperTableCell>
                    <PaperTableCell>{i.title}</PaperTableCell>
                    <PaperTableCell>{i.applicant}</PaperTableCell>
                    <PaperTableCell>
                      <PaperBadge variant={statusMap[i.status]?.variant || 'warning'}>{statusMap[i.status]?.text || '未知状态'}</PaperBadge>
                    </PaperTableCell>
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
