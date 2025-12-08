'use client';

import { Plus } from 'lucide-react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';
import { VirtualizedTableBody } from '@/components/ui/virtualized-table-body';

import { StockRecord } from '../useToolsPageState';

interface OutboundTableProps {
  records: StockRecord[];
  getRecordTypeBadge: (recordType: StockRecord['recordType'], type: StockRecord['type']) => { variant: string; text: string };
}

export const OutboundTable = ({ records, getRecordTypeBadge }: OutboundTableProps) => {
  const renderRow = (record: StockRecord) => {
    const badgeProps = getRecordTypeBadge(record.recordType, record.type);
    return (
      <PaperTableRow key={record.id}>
        <PaperTableCell><PaperBadge variant={badgeProps.variant as any}>{badgeProps.text}</PaperBadge></PaperTableCell>
        <PaperTableCell>{record.relatedNo}</PaperTableCell>
        <PaperTableCell>{record.sku} - {record.productName}</PaperTableCell>
        <PaperTableCell className="text-error-600">-{record.qty}</PaperTableCell>
        <PaperTableCell>{record.operator}</PaperTableCell>
        <PaperTableCell>{record.time}</PaperTableCell>
        <PaperTableCell>
          <div className="flex space-x-2">
            <PaperButton size="sm" variant="ghost">查看</PaperButton>
            <PaperButton size="sm" variant="outline">编辑</PaperButton>
          </div>
        </PaperTableCell>
      </PaperTableRow>
    );
  };

  return (
    <PaperCard>
      <PaperCardHeader>
        <div className="flex items-center justify-between">
          <PaperCardTitle>出库记录</PaperCardTitle>
          <div className="flex space-x-2">
            <PaperButton variant="outline" size="sm">导入</PaperButton>
            <PaperButton variant="outline" size="sm">导出</PaperButton>
            <PaperButton variant="primary" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              新增出库
            </PaperButton>
          </div>
        </div>
      </PaperCardHeader>
      <PaperCardContent className="p-0">
        <PaperTable>
          <PaperTableHeader>
            <PaperTableCell>类型</PaperTableCell>
            <PaperTableCell>关联单号</PaperTableCell>
            <PaperTableCell>商品</PaperTableCell>
            <PaperTableCell>数量</PaperTableCell>
            <PaperTableCell>操作人</PaperTableCell>
            <PaperTableCell>时间</PaperTableCell>
            <PaperTableCell>操作</PaperTableCell>
          </PaperTableHeader>
          <VirtualizedTableBody
            items={records}
            renderRow={renderRow}
            estimatedRowHeight={60}
            containerHeight={500}
          />
        </PaperTable>
      </PaperCardContent>
    </PaperCard>
  );
};