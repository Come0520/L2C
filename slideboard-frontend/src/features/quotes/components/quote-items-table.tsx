import React from 'react';

import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';
import { QuoteItem } from '@/shared/types/quote';

interface QuoteItemsTableProps {
  items: QuoteItem[];
  totalAmount: number;
}

export function QuoteItemsTable({ items, totalAmount }: QuoteItemsTableProps) {
  return (
    <PaperTable>
      <PaperTableHeader>
        <PaperTableCell>项目名称</PaperTableCell>
        <PaperTableCell>空间</PaperTableCell>
        <PaperTableCell>数量</PaperTableCell>
        <PaperTableCell>单位</PaperTableCell>
        <PaperTableCell>单价</PaperTableCell>
        <PaperTableCell>总价</PaperTableCell>
      </PaperTableHeader>
      <PaperTableBody>
        {items.map((item, index) => (
          <PaperTableRow key={item.id || index}>
            <PaperTableCell>
              <div className="flex flex-col">
                <span className="font-medium">{item.productName}</span>
                {item.description && (
                  <span className="text-xs text-ink-500">{item.description}</span>
                )}
              </div>
            </PaperTableCell>
            <PaperTableCell>{item.space}</PaperTableCell>
            <PaperTableCell>{item.quantity}</PaperTableCell>
            <PaperTableCell>{item.unit || '-'}</PaperTableCell>
            <PaperTableCell>¥{item.unitPrice.toLocaleString()}</PaperTableCell>
            <PaperTableCell>¥{item.totalPrice.toLocaleString()}</PaperTableCell>
          </PaperTableRow>
        ))}
        <PaperTableRow className="font-medium bg-paper-50/50">
          <PaperTableCell colSpan={5} className="text-right">合计</PaperTableCell>
          <PaperTableCell className="text-primary-600 text-lg">
            ¥{totalAmount.toLocaleString()}
          </PaperTableCell>
        </PaperTableRow>
      </PaperTableBody>
    </PaperTable>
  );
}
