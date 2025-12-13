'use client';

import React from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

import { ReconciliationStatement } from '@/shared/types/reconciliation';

interface StatementListProps {
  statements: ReconciliationStatement[];
  onView: (id: string) => void;
}

export function StatementList({ statements, onView }: StatementListProps) {
  const getStatusBadgeVariant = (status: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (status) {
      case 'settled': return 'success';
      case 'confirmed': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'confirmed': return '已确认';
      case 'settled': return '已结清';
      default: return status;
    }
  };

  return (
    <PaperTable>
      <PaperTableHeader>
        <PaperTableCell>对账单号</PaperTableCell>
        <PaperTableCell>对账对象</PaperTableCell>
        <PaperTableCell>对账周期</PaperTableCell>
        <PaperTableCell>总金额</PaperTableCell>
        <PaperTableCell>状态</PaperTableCell>
        <PaperTableCell>创建时间</PaperTableCell>
        <PaperTableCell>操作</PaperTableCell>
      </PaperTableHeader>
      <PaperTableBody>
        {statements.map(stmt => (
          <PaperTableRow key={stmt.id}>
            <PaperTableCell>{stmt.statementNo}</PaperTableCell>
            <PaperTableCell>{stmt.targetName}</PaperTableCell>
            <PaperTableCell>{stmt.periodStart} ~ {stmt.periodEnd}</PaperTableCell>
            <PaperTableCell>¥{stmt.totalAmount.toLocaleString()}</PaperTableCell>
            <PaperTableCell>
              <PaperBadge variant={getStatusBadgeVariant(stmt.status)}>
                {getStatusLabel(stmt.status)}
              </PaperBadge>
            </PaperTableCell>
            <PaperTableCell>{new Date(stmt.createdAt).toLocaleDateString()}</PaperTableCell>
            <PaperTableCell>
              <PaperButton size="sm" variant="ghost" onClick={() => onView(stmt.id)}>查看</PaperButton>
            </PaperTableCell>
          </PaperTableRow>
        ))}
        {statements.length === 0 && (
          <PaperTableRow>
            <PaperTableCell colSpan={7} className="text-center py-8 text-ink-400">
              暂无对账单
            </PaperTableCell>
          </PaperTableRow>
        )}
      </PaperTableBody>
    </PaperTable>
  );
}
